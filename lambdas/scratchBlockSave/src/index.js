
const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-2" });
const s3 = new AWS.S3();

const BUCKET = "scratchblocks";
const DELIMITER = "~|@^|@|~";
const MAX_VERSION_PAGES = 50; // safety stop for listAllVersions (~50k versions)

exports.handler = async function (event) {
    try {
        if (event.httpMethod !== "POST" || typeof event.body !== "string") {
            return buildResponse(404, { message: "Not Found" });
        }

        if (event.body.includes(DELIMITER)) {
            const cut = event.body.indexOf(DELIMITER);
            const key = event.body.slice(0, cut);
            const projectJson = event.body.slice(cut + DELIMITER.length);
            return await postData(key, projectJson);
        }

        return await getVersion(event.body);
    } catch (err) {
        console.error("Unhandled error:", err);
        return buildResponse(500, { message: err.message });
    }
};

function buildResponse(statusCode, body) {
    return {
        statusCode: statusCode,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    };
}

/**
 * Page through the versions of "<key>.json" newest-first, collapsing runs of
 * consecutive equal-size versions to their newest member, and stop as soon as
 * `needed` distinct-size versions have been found (or the history runs out).
 *
 * Bounding the walk to ~`needed` versions instead of listing the entire history
 * keeps this well under the Lambda timeout even for a room with a huge version log.
 *
 * @returns {{distinct: object[], exhausted: boolean}} distinct[0] is the newest
 *     save; `exhausted` is true when the end of the history was reached.
 */
async function collectDistinctVersions(key, needed) {
    const objectKey = key + ".json";
    const distinct = [];
    let prevSize;
    let keyMarker;
    let versionIdMarker;
    let pages = 0;
    let exhausted = false;

    while (distinct.length < needed && pages < MAX_VERSION_PAGES) {
        const page = await s3
            .listObjectVersions({
                Bucket: BUCKET,
                Prefix: objectKey,
                MaxKeys: 100,
                KeyMarker: keyMarker,
                VersionIdMarker: versionIdMarker,
            })
            .promise();
        pages++;

        for (const v of page.Versions || []) {
            // Prefix is a starts-with match; keep only the exact key so a sibling
            // like "<key>.json.bak" can't slip into the history. S3 lists a page
            // newest-first, so a running-size compare dedupes correctly, and it
            // carries across page boundaries because prevSize outlives the loop.
            if (v.Key !== objectKey) continue;
            if (v.Size !== prevSize) {
                distinct.push(v);
                prevSize = v.Size;
                if (distinct.length >= needed) break;
            }
        }

        if (page.IsTruncated && distinct.length < needed) {
            keyMarker = page.NextKeyMarker;
            versionIdMarker = page.NextVersionIdMarker;
        } else {
            exhausted = !page.IsTruncated;
            break;
        }
    }

    return { distinct: distinct, exhausted: exhausted };
}

async function getVersion(rawBody) {
    console.log("Load request:", rawBody);

    const req = JSON.parse(rawBody);
    const key = req.key;

    // Prefer versionOffset. Fall back to the old `vid` flag for older callers:
    // vid === 1 meant "one back", anything else meant "current".
    let requestedOffset = req.versionOffset;
    if (requestedOffset === undefined || requestedOffset === null) {
        requestedOffset = req.vid === 1 ? 1 : 0;
    }
    requestedOffset = Math.max(0, parseInt(requestedOffset, 10) || 0);

    const { distinct } = await collectDistinctVersions(key, requestedOffset + 1);
    if (distinct.length === 0) {
        return buildResponse(404, { message: "No versions found" });
    }

    const reachedOffset = Math.min(requestedOffset, distinct.length - 1);
    const selected = distinct[reachedOffset];

    return buildResponse(200, {
        versionId: selected.VersionId,
        requestedOffset: requestedOffset,
        // The offset actually reached: smaller than requested when the caller asked
        // for more history than exists. Clients pin their UI to this.
        versionOffset: reachedOffset,
        distinctVersionsSeen: distinct.length,
        // Retained so the previous marker-walking client still parses a response.
        keyMarker: key + ".json",
        versionIdMarker: selected.VersionId,
        versionData: await getBody(key, selected.VersionId),
    });
}

async function getBody(key, versionId) {
    try {
        const data = await s3
            .getObject({ Bucket: BUCKET, Key: key + ".json", VersionId: versionId })
            .promise();
        return data.Body.toString("utf-8");
    } catch (err) {
        console.error("getObject failed:", err);
        return "EMT";
    }
}

async function newestVersion(key) {
    const objectKey = key + ".json";
    const page = await s3
        .listObjectVersions({ Bucket: BUCKET, Prefix: objectKey, MaxKeys: 20 })
        .promise();
    return (page.Versions || []).find(v => v.Key === objectKey) || null;
}

async function postData(key, projectJson) {
    const size = Buffer.byteLength(projectJson, "utf8");
    console.log(`Save request: ${key}.json (${size} bytes)`);

    try {
        const current = await newestVersion(key);
        if (current && current.Size === size) {
            console.log("Payload size matches newest version; skipping save.");
            return buildResponse(200, {
                message: "No change detected; save skipped",
                skipped: true,
            });
        }
    } catch (err) {
        // Non-fatal: if the duplicate check breaks, save anyway rather than drop an edit.
        console.warn("Duplicate check failed, saving anyway:", err.message);
    }

    try {
        await s3
            .upload({
                Bucket: BUCKET,
                Key: key + ".json",
                Body: projectJson,
                ContentType: "text/plain",
            })
            .promise();
        return buildResponse(200, { message: "File uploaded successfully" });
    } catch (err) {
        console.error("Upload failed:", err);
        return buildResponse(500, { message: "Error uploading file" });
    }
}
