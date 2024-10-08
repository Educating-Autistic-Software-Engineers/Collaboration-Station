(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["GUI"] = factory();
	else
		root["GUI"] = factory();
})(self, () => {
return (self["webpackChunkGUI"] = self["webpackChunkGUI"] || []).push([["gui"],{

/***/ "./src/components/ConditionalApp.jsx":
/*!*******************************************!*\
  !*** ./src/components/ConditionalApp.jsx ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var _lib_app_state_hoc_jsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../lib/app-state-hoc.jsx */ "./src/lib/app-state-hoc.jsx");
/* harmony import */ var _browser_modal_browser_modal_jsx__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./browser-modal/browser-modal.jsx */ "./src/components/browser-modal/browser-modal.jsx");
/* harmony import */ var _lib_supported_browser_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../lib/supported-browser.js */ "./src/lib/supported-browser.js");
/* harmony import */ var _playground_index_css__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../playground/index.css */ "./src/playground/index.css");
/* harmony import */ var _playground_index_css__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_playground_index_css__WEBPACK_IMPORTED_MODULE_4__);





//import BrowserModalComponent from '../components/browser-modal/browser-modal.jsx';

// Assuming this function retrieves space name from URL
const appTarget = document.createElement('div');
appTarget.className = (_playground_index_css__WEBPACK_IMPORTED_MODULE_4___default().app);
document.body.appendChild(appTarget);
_browser_modal_browser_modal_jsx__WEBPACK_IMPORTED_MODULE_2__["default"].setAppElement(appTarget);
const WrappedBrowserModalComponent = (0,_lib_app_state_hoc_jsx__WEBPACK_IMPORTED_MODULE_1__["default"])(_browser_modal_browser_modal_jsx__WEBPACK_IMPORTED_MODULE_2__["default"], true /* localesOnly */);
const handleBack = () => {};
const ConditionalApp = () => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0__.createElement(react__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, (0,_lib_supported_browser_js__WEBPACK_IMPORTED_MODULE_3__["default"])() ?
// require needed here to avoid importing unsupported browser-crashing code
(__webpack_require__(/*! ../playground/render-gui.jsx */ "./src/playground/render-gui.jsx")["default"])(appTarget) : /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0__.createElement(WrappedBrowserModalComponent, {
  onBack: handleBack
}));
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (ConditionalApp);

/***/ }),

/***/ "./src/playground/CursorOverlay.jsx":
/*!******************************************!*\
  !*** ./src/playground/CursorOverlay.jsx ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var _ably_spaces_react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @ably/spaces/react */ "./node_modules/@ably/spaces/dist/mjs/react/index.js");
/* harmony import */ var _utils_mockNames_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/mockNames.js */ "./src/utils/mockNames.js");
/* harmony import */ var _utils_helpers_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/helpers.js */ "./src/utils/helpers.js");
/* harmony import */ var _utils_useCursor_jsx__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils/useCursor.jsx */ "./src/utils/useCursor.jsx");
/* harmony import */ var _utils_LiveCursors_module_css__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../utils/LiveCursors.module.css */ "./src/utils/LiveCursors.module.css");
/* harmony import */ var _utils_LiveCursors_module_css__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_utils_LiveCursors_module_css__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _index_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./index.css */ "./src/playground/index.css");
/* harmony import */ var _index_css__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_index_css__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var core_js_fn_array_includes__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! core-js/fn/array/includes */ "./node_modules/core-js/fn/array/includes.js");
/* harmony import */ var core_js_fn_array_includes__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(core_js_fn_array_includes__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var intl__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! intl */ "./node_modules/intl/index.js");
/* harmony import */ var intl__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(intl__WEBPACK_IMPORTED_MODULE_8__);
/* harmony import */ var _components_ConditionalApp_jsx__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../components/ConditionalApp.jsx */ "./src/components/ConditionalApp.jsx");
/* harmony import */ var _utils_AblyHandlers_jsx__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../utils/AblyHandlers.jsx */ "./src/utils/AblyHandlers.jsx");
// LiveCursors.jsx








//import 'es6-object-assign/auto';

//import 'core-js/fn/promise/finally';



const mockName = () => _utils_mockNames_js__WEBPACK_IMPORTED_MODULE_2__.mockNames[Math.floor(Math.random() * _utils_mockNames_js__WEBPACK_IMPORTED_MODULE_2__.mockNames.length)];
const CursorOverlay = () => {
  const name = (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(mockName, []);
  const userColors = (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(() => _utils_helpers_js__WEBPACK_IMPORTED_MODULE_3__.colours[Math.floor(Math.random() * _utils_helpers_js__WEBPACK_IMPORTED_MODULE_3__.colours.length)], []);
  const {
    space
  } = (0,_ably_spaces_react__WEBPACK_IMPORTED_MODULE_1__.useSpace)();
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    space === null || space === void 0 || space.enter({
      name,
      userColors
    });
  }, [space]);
  const {
    self
  } = (0,_ably_spaces_react__WEBPACK_IMPORTED_MODULE_1__.useMembers)();
  const liveCursors = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);

  /*
  const cursorUpdate = async (spaces) => {
      const space2 = await spaces.get("test");
      await space2.enter({ name: "Ryon" })
        space2.subscribe('update', (spaceState) => {
          console.log("hi");
      });
        space2.cursors.subscribe("update", async (cursor) => {
          console.log("HI");
          const members = await space2.members.getAll();
          const member = members.find((member) => member.connectionId === cursorUpdate.connectionId);
          MemberCursors(member, cursor);
          YourCursor();
      })
  } 
  cursorUpdate(spaces);
  */

  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  let uname = urlParams.get('name');
  const [websocket, setWebSocket] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    console.log("wss://nwab9zf1ik.execute-api.us-east-2.amazonaws.com/production/?room=".concat(_utils_AblyHandlers_jsx__WEBPACK_IMPORTED_MODULE_10__.ablySpace));
    const ws = new WebSocket("wss://nwab9zf1ik.execute-api.us-east-2.amazonaws.com/production/?room=".concat(_utils_AblyHandlers_jsx__WEBPACK_IMPORTED_MODULE_10__.ablySpace));
    ws.onopen = () => {
      console.log('WebSocket Client Connected', ws);
      setWebSocket(ws);
    };
    ws.onclose = () => {
      console.log('WebSocket Client Disconnected');
      setWebSocket(null);
    };
    const keepAlive = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'ping'
        }));
      }
    }, 30000); // send a ping message every 30 seconds

    return () => {
      clearInterval(keepAlive);
      if (ws) {
        ws.close();
      }
    };
  }, []);
  if (!websocket) {
    return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", null, "Loading...");
  }
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", {
    id: "live-cursors",
    ref: liveCursors,
    className: (_index_css__WEBPACK_IMPORTED_MODULE_6___default().app)
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0__.createElement(_components_ConditionalApp_jsx__WEBPACK_IMPORTED_MODULE_9__["default"], null), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0__.createElement(_utils_useCursor_jsx__WEBPACK_IMPORTED_MODULE_4__.YourCursor, {
    self: self,
    name: uname,
    websocket: websocket
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0__.createElement(_utils_useCursor_jsx__WEBPACK_IMPORTED_MODULE_4__.MemberCursors, {
    websocket: websocket
  }));
  /*
  <YourCursor self={self} parentRef={liveCursors} className={styles.overlay} />
          <MemberCursors />
          */
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (CursorOverlay);

/***/ }),

/***/ "./src/playground/index.jsx":
/*!**********************************!*\
  !*** ./src/playground/index.jsx ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react_dom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-dom */ "./node_modules/react-dom/index.js");
/* harmony import */ var _utils_useCursor_jsx__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/useCursor.jsx */ "./src/utils/useCursor.jsx");
/* harmony import */ var _index_css__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./index.css */ "./src/playground/index.css");
/* harmony import */ var _index_css__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_index_css__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _lib_supported_browser_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../lib/supported-browser.js */ "./src/lib/supported-browser.js");
/* harmony import */ var _ably_spaces_react__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @ably/spaces/react */ "./node_modules/@ably/spaces/dist/mjs/react/index.js");
/* harmony import */ var nanoid__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! nanoid */ "./node_modules/nanoid/index.browser.js");
/* harmony import */ var _ably_spaces__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @ably/spaces */ "./node_modules/@ably/spaces/dist/mjs/index.js");
/* harmony import */ var ably__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ably */ "./node_modules/ably/build/ably-commonjs.js");
/* harmony import */ var ably__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(ably__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var _utils_helpers__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../utils/helpers */ "./src/utils/helpers.js");
/* harmony import */ var _CursorOverlay_jsx__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./CursorOverlay.jsx */ "./src/playground/CursorOverlay.jsx");
/* harmony import */ var ably_react__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ably/react */ "./node_modules/ably/react/cjs/index.js");
/* harmony import */ var ably_react__WEBPACK_IMPORTED_MODULE_10___default = /*#__PURE__*/__webpack_require__.n(ably_react__WEBPACK_IMPORTED_MODULE_10__);
/* harmony import */ var _utils_Secrets_jsx__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../utils/Secrets.jsx */ "./src/utils/Secrets.jsx");
/* harmony import */ var _components_direction_picker_direction_picker_jsx__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ../components/direction-picker/direction-picker.jsx */ "./src/components/direction-picker/direction-picker.jsx");
/* harmony import */ var _components_ConditionalApp_jsx__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ../components/ConditionalApp.jsx */ "./src/components/ConditionalApp.jsx");






//import * as serviceWorker from './serviceWorker';








/*



import Spaces from "@ably/spaces";
import { SpacesProvider, SpaceProvider } from "@ably/spaces/react";
*/





const id = (0,nanoid__WEBPACK_IMPORTED_MODULE_14__.nanoid)();
const spaceName = (0,_utils_helpers__WEBPACK_IMPORTED_MODULE_8__.getSpaceNameFromUrl)();
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const username = urlParams.get('name').toString();

//const client = new Realtime({ authUrl: "https://0dhyl8bktg.execute-api.us-east-2.amazonaws.com/scratchBlock/ablyToken?name=" + username});
//const spaces = new Spaces(client2);

/*
const space = await spaces.get("test");
await space.enter({ name: "Ryon" })

space.subscribe('update', (spaceState) => {
    console.log("hi");
});

space.cursors.subscribe("update", async (cursor) => {
    console.log("HI");
    const members = await space.members.getAll();
    const member = members.find((member) => member.connectionId === cursorUpdate.connectionId);
    MemberCursors(member, cursor);
    YourCursor();
})

window.addEventListener('mousemove', ({ clientX, clientY }) => {
    space.cursors.set({ position: { x: clientX, y: clientY }, data: { color: 'red' } });
});
*/

const appTarget = document.createElement('div');
appTarget.className = (_index_css__WEBPACK_IMPORTED_MODULE_3___default().topheader);
document.body.appendChild(appTarget);

/*

    <SpacesProvider client={spaces}>
        <SpaceProvider name="my-space">
*/

react_dom__WEBPACK_IMPORTED_MODULE_1__.render(
/*#__PURE__*/
// <AblyProvider client={client}>
react__WEBPACK_IMPORTED_MODULE_0__.createElement(_CursorOverlay_jsx__WEBPACK_IMPORTED_MODULE_9__["default"], null)
// </AblyProvider>
, appTarget);
;
/*
if (supportedBrowser()) {
    // require needed here to avoid importing unsupported browser-crashing code
    // at the top level
    ReactDOM.render(
        require('./render-gui.jsx').default(appTarget),
        appTarget
    );

} else {
    BrowserModalComponent.setAppElement(appTarget);
    const WrappedBrowserModalComponent = AppStateHOC(BrowserModalComponent, true);
    const handleBack = () => {};
    // eslint-disable-next-line react/jsx-no-bind
    ReactDOM.render(<WrappedBrowserModalComponent onBack={handleBack} />, appTarget);
}
*/

/***/ }),

/***/ "./src/playground/render-gui.jsx":
/*!***************************************!*\
  !*** ./src/playground/render-gui.jsx ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react_dom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-dom */ "./node_modules/react-dom/index.js");
/* harmony import */ var redux__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! redux */ "./node_modules/redux/es/index.js");
/* harmony import */ var _lib_app_state_hoc_jsx__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../lib/app-state-hoc.jsx */ "./src/lib/app-state-hoc.jsx");
/* harmony import */ var _containers_gui_jsx__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../containers/gui.jsx */ "./src/containers/gui.jsx");
/* harmony import */ var _lib_hash_parser_hoc_jsx__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../lib/hash-parser-hoc.jsx */ "./src/lib/hash-parser-hoc.jsx");
/* harmony import */ var _lib_log_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../lib/log.js */ "./src/lib/log.js");







const onClickLogo = () => {
  window.open('https://www.edase.org', '_blank');
};
const handleTelemetryModalCancel = () => {
  (0,_lib_log_js__WEBPACK_IMPORTED_MODULE_6__["default"])('User canceled telemetry modal');
};
const handleTelemetryModalOptIn = () => {
  (0,_lib_log_js__WEBPACK_IMPORTED_MODULE_6__["default"])('User opted into telemetry');
};
const handleTelemetryModalOptOut = () => {
  (0,_lib_log_js__WEBPACK_IMPORTED_MODULE_6__["default"])('User opted out of telemetry');
};

/*
 * Render the GUI playground. This is a separate function because importing anything
 * that instantiates the VM causes unsupported browsers to crash
 * {object} appTarget - the DOM element to render to
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (appTarget => {
  _containers_gui_jsx__WEBPACK_IMPORTED_MODULE_4__["default"].setAppElement(appTarget);

  // note that redux's 'compose' function is just being used as a general utility to make
  // the hierarchy of HOC constructor calls clearer here; it has nothing to do with redux's
  // ability to compose reducers.
  const WrappedGui = (0,redux__WEBPACK_IMPORTED_MODULE_2__.compose)(_lib_app_state_hoc_jsx__WEBPACK_IMPORTED_MODULE_3__["default"], _lib_hash_parser_hoc_jsx__WEBPACK_IMPORTED_MODULE_5__["default"])(_containers_gui_jsx__WEBPACK_IMPORTED_MODULE_4__["default"]);

  // TODO a hack for testing the backpack, allow backpack host to be set by url param
  const backpackHostMatches = window.location.href.match(/[?&]backpack_host=([^&]*)&?/);
  const backpackHost = backpackHostMatches ? backpackHostMatches[1] : null;
  const scratchDesktopMatches = window.location.href.match(/[?&]isScratchDesktop=([^&]+)/);
  let simulateScratchDesktop;
  if (scratchDesktopMatches) {
    try {
      // parse 'true' into `true`, 'false' into `false`, etc.
      simulateScratchDesktop = JSON.parse(scratchDesktopMatches[1]);
    } catch (_unused) {
      // it's not JSON so just use the string
      // note that a typo like "falsy" will be treated as true
      simulateScratchDesktop = scratchDesktopMatches[1];
    }
  }
  if (false) {}
  return (
    // important: this is checking whether `simulateScratchDesktop` is truthy, not just defined!
    simulateScratchDesktop ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0__.createElement(WrappedGui, {
      canEditTitle: true,
      isScratchDesktop: true,
      showTelemetryModal: true,
      canSave: false,
      onTelemetryModalCancel: handleTelemetryModalCancel,
      onTelemetryModalOptIn: handleTelemetryModalOptIn,
      onTelemetryModalOptOut: handleTelemetryModalOptOut
    }) : /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0__.createElement(WrappedGui, {
      canEditTitle: true,
      backpackVisible: true,
      showComingSoon: true,
      backpackHost: backpackHost,
      canSave: false,
      onClickLogo: onClickLogo
    })
  );
});

/***/ }),

/***/ "./src/utils/CursorSvg.jsx":
/*!*********************************!*\
  !*** ./src/utils/CursorSvg.jsx ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");

const CursorSvg = _ref => {
  let {
    cursorColor
  } = _ref;
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0__.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: "18",
    height: "19",
    viewBox: "0 0 18 19",
    fill: "none"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0__.createElement("path", {
    d: "M0.22033 3.02709L4.59403 17.4603C5.06656 19.0196 7.05862 19.4688 8.15466 18.2632L16.9021 8.64108C17.9041 7.5388 17.4704 5.7725 16.0718 5.25966L2.95072 0.4486C1.32539 -0.147356 -0.281717 1.37034 0.22033 3.02709Z",
    fill: cursorColor
  }));
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (CursorSvg);

/***/ }),

/***/ "./src/utils/helpers.js":
/*!******************************!*\
  !*** ./src/utils/helpers.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   colours: () => (/* binding */ colours),
/* harmony export */   getSpaceNameFromUrl: () => (/* binding */ getSpaceNameFromUrl)
/* harmony export */ });
/* harmony import */ var random_words__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! random-words */ "./node_modules/random-words/index.js");

const colours = [{
  cursorColor: "#FE372B"
}, {
  cursorColor: "#9C007E"
}, {
  cursorColor: "#008E06"
}, {
  cursorColor: "#460894"
}, {
  cursorColor: "#0284CD"
}, {
  cursorColor: "#AC8600"
}, {
  cursorColor: "#FF723F"
}, {
  cursorColor: "#FF17D2"
}, {
  cursorColor: "#00E80B"
}, {
  cursorColor: "#7A1BF2"
}, {
  cursorColor: "#2CC0FF"
}, {
  cursorColor: "#FFC700"
}];
const getSpaceNameFromUrl = () => {
  const url = new URL(window.location.href);
  const spaceNameInParams = url.searchParams.get("space");
  if (spaceNameInParams) {
    return spaceNameInParams;
  } else {
    const generatedName = (0,random_words__WEBPACK_IMPORTED_MODULE_0__.generate)({
      exactly: 3,
      join: "-"
    });
    url.searchParams.set("space", generatedName);
    window.history.replaceState({}, "", "?".concat(url.searchParams.toString()));
    return generatedName;
  }
};

/***/ }),

/***/ "./src/utils/mockNames.js":
/*!********************************!*\
  !*** ./src/utils/mockNames.js ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getMemberName: () => (/* binding */ getMemberName),
/* harmony export */   mockNames: () => (/* binding */ mockNames)
/* harmony export */ });
const mockNames = ["Anum Reeve", "Tiernan Stubbs", "Hakim Hernandez", "Madihah Maynard", "Mac Beard", "Gracie-Mae Dunne", "Oliver Leigh", "Jose Tapia", "Lyle Beasley", "Arslan Samuels", "Dolores Viale", "Romola De Carlo", "Nilde Mancino", "Donata Curro", "Beatrice Pata", "Ella Notaro", "Acilia Simoni", "Berenice Rutigliano", "Ilia Gangi", "Atanasia Bonacci", "Jyoti Sane", "Shaili Potrick", "Manjusha Dehadray", "Meera Deoghar", "Sameera Bhole", "Bimla Jichkar", "Kavita Phadake", "Unnati Zantye", "Chandra Govatrikar", "Gauravi Kotwal", "Keenan Robinson", "Destin Ellis", "Tremon Epps", "Quinell Palmer", "Demarien Murphy", "Andres Coleman", "Reginal Charles", "Terryl Young", "Herold Mitchell", "Kione Butler", "Magdalena Czech", "Wioleta Pach", "Zofia Stasiak", "Cecylia Wydra", "Balbina Ochocka", "Kinga Piłat", "Kalina Krzemien", "Olga Moszkowicz", "Maryla Jeżewska", "Odeta Turek", "Noud Groothalle", "Teun Ekkerink", "Pier Assendorp", "Matthijs Mennink", "Korneel Septer", "Andries IJsak", "Freek Vellener", "Koen Lokman", "Lodewijk Struijck", "Stefaan Houtzagers", "Buddy Saunders", "Dennis Hunter", "Alfie Moss", "River Lewis", "Tomas Stone", "Samuel Kelly", "Rory Phillips", "Thomas Hussain", "Ralphy Palmer", "Eric Evans", "Silver Gardner", "Jody Wright", "Dane Mills", "Sam Mason", "Rudy Powell", "Carol Griffith", "Brynn Witt", "Jaden Terrell", "Riley Rice", "Ash Mcintosh", "Rowan Edwards", "Ryan Shaw", "Riley Harris", "Danni Francis", "Will Lloyd", "Danni Roy", "Alex Dean", "Bev Gamble", "Danny Blair", "Leslie Diaz", "Sugondo Xiaohui", "Ateng Nuwa", "Ymkje Anakotta", "Merry Situmorang", "Jochebed Selangit", "Ruby Silo", "Raja Nizar", "Fida Nicola", "Fairuz Jasir", "Tarub Jamal", "Zainab Sabri", "Rima Khalid", "Najla Karam", "Oleksandra Andriyenko", "Sofiya Hlushko", "Myroslava Kornijchuk", "Alina Tymchenko", "Lina Kravchuk", "Zhanna Novikova", "Natalya Kravets", "Nadiya Movchan", "Nina Sayenko", "Hanna Tretyak", "Artim Washere"];
const getMemberName = () => mockNames[Math.floor(Math.random() * mockNames.length)];

/***/ }),

/***/ "./src/utils/useCursor.jsx":
/*!*********************************!*\
  !*** ./src/utils/useCursor.jsx ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MemberCursors: () => (/* binding */ MemberCursors),
/* harmony export */   YourCursor: () => (/* binding */ YourCursor)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var _utils_AblyHandlers_jsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/AblyHandlers.jsx */ "./src/utils/AblyHandlers.jsx");
/* harmony import */ var _CursorSvg_jsx__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./CursorSvg.jsx */ "./src/utils/CursorSvg.jsx");
/* harmony import */ var _Cursors_module_css__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./Cursors.module.css */ "./src/utils/Cursors.module.css");
/* harmony import */ var _Cursors_module_css__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_Cursors_module_css__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var core_js_core_object__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! core-js/core/object */ "./node_modules/core-js/core/object.js");
/* harmony import */ var core_js_core_object__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(core_js_core_object__WEBPACK_IMPORTED_MODULE_4__);
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }





let thisName;
const cursorWidth = 90; // width of your cursor SVG
const cursorHeight = 60; // height of your cursor SVG

const channel = _utils_AblyHandlers_jsx__WEBPACK_IMPORTED_MODULE_1__.ablyInstance.channels.get(_utils_AblyHandlers_jsx__WEBPACK_IMPORTED_MODULE_1__.ablySpace);
sessionStorage.setItem('blocksRect', JSON.stringify({
  x: 0,
  y: 0,
  right: 0,
  bottom: 0
}));
const clampPosition = (position, maxPosition, elementSize) => {
  return Math.max(0, Math.min(position, maxPosition - elementSize));
};
const YourCursor = _ref => {
  let {
    self,
    name,
    websocket
  } = _ref;
  const [position, setPosition] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)({
    x: 0,
    y: 0
  });
  const latestPosition = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(position);
  let cachedPosition = {
    x: 0,
    y: 0
  };
  let emitIndex = 0;
  thisName = name;
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    const handleMouseMove = event => {
      const newPosition = {
        x: event.clientX,
        y: event.clientY
      };
      setPosition(newPosition);
      latestPosition.current = newPosition;
    };
    window.addEventListener('mousemove', handleMouseMove);
    const intervalId = setInterval(() => {
      if (!websocket) {
        return;
      }
      const tabIndex = sessionStorage.getItem("activeTabIndex");
      const blockRect = JSON.parse(sessionStorage.getItem('blocksRect'));
      let isHovering = latestPosition.current.x < blockRect.right; // && latestPosition.y > blockRect.y
      if (Number(tabIndex) > 0.5) {
        isHovering = false;
      }

      //console.log(tabIndex)

      //console.log(blockRect, latestPosition.current.x, blockRect.right, isHovering)

      const dragPos = isHovering ? JSON.parse(sessionStorage.getItem("dragRelative")) : {
        x: 0,
        y: 0
      };
      const globalPosition = {
        x: latestPosition.current.x - dragPos.x,
        y: latestPosition.current.y - dragPos.y
      };
      if (JSON.stringify(cachedPosition) === JSON.stringify(globalPosition)) return;
      cachedPosition = globalPosition;

      //console.log(document.getElementById('totalsize').getBoundingClientRect());

      // console.log("SENDING!!!", globalPosition)
      // console.log(ablySpace, name)
      websocket.send(JSON.stringify({
        action: "cursorMessage",
        target: sessionStorage.getItem("editingTarget"),
        room: _utils_AblyHandlers_jsx__WEBPACK_IMPORTED_MODULE_1__.ablySpace,
        emitIndex: emitIndex++,
        tabIndex: tabIndex,
        clientId: name,
        position: globalPosition,
        hovering: isHovering,
        color: _utils_AblyHandlers_jsx__WEBPACK_IMPORTED_MODULE_1__.cursorColor,
        ogWindow: {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight
        },
        rect: sessionStorage.getItem("blocksRect")
      }));
    }, 65);

    // Cleanup the event listener and interval on component unmount
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(intervalId);
    };
  }, [self]);

  // Get the viewport dimensions
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Clamp the positions
  const clampedX = clampPosition(position.x, viewportWidth, cursorWidth);
  const clampedY = clampPosition(position.y, viewportHeight, cursorHeight);
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", {
    className: (_Cursors_module_css__WEBPACK_IMPORTED_MODULE_3___default().cursor),
    style: {
      top: "".concat(clampedY, "px"),
      left: "".concat(clampedX, "px")
    }
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0__.createElement(_CursorSvg_jsx__WEBPACK_IMPORTED_MODULE_2__["default"], {
    cursorColor: _utils_AblyHandlers_jsx__WEBPACK_IMPORTED_MODULE_1__.cursorColor
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", {
    style: {
      backgroundColor: _utils_AblyHandlers_jsx__WEBPACK_IMPORTED_MODULE_1__.cursorColor
    },
    className: (_Cursors_module_css__WEBPACK_IMPORTED_MODULE_3___default().cursorName)
  }, "You"));
};
const MemberCursors = _ref2 => {
  let {
    websocket
  } = _ref2;
  const [cursors, setCursors] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)({});
  let highestEmitIndices = {};
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (!websocket) {
      console.warn('WebSocket is not defined');
      return;
    }
    const handleCursorMessage = message => {
      // console.log(message)
      try {
        const {
          rect
        } = JSON.parse(message.data);
        JSON.parse(rect);
      } catch (e) {
        // console.log(e, message.data)
        return;
      }
      const {
        clientId,
        position,
        hovering,
        emitIndex,
        target,
        color,
        tabIndex,
        ogWindow,
        rect
      } = JSON.parse(message.data);
      if (emitIndex < highestEmitIndices[clientId]) return;
      highestEmitIndices[clientId] = emitIndex;

      // console.log(thisName, clientId)
      if (clientId === thisName) return;
      const ogRect = JSON.parse(rect);
      const blockRect = JSON.parse(sessionStorage.getItem('blocksRect'));
      let isInvisible = false;
      const dragOffset = JSON.parse(sessionStorage.getItem("dragRelative"));
      const dragPos = hovering && !(position.x + dragOffset.x < 312) ? dragOffset : {
        x: 0,
        y: 0
      };
      let relposition = {
        x: position.x + dragPos.x,
        y: position.y + dragPos.y
      };
      if (hovering) {
        if (relposition.x < blockRect.x || relposition.y < blockRect.y || relposition.x > blockRect.right || relposition.y > blockRect.bottom) {
          isInvisible = true;
        }
      } else {
        const xScale = (window.innerWidth - blockRect.right) / (ogWindow.innerWidth - ogRect.right);
        relposition.x = (relposition.x - ogRect.right) * xScale + blockRect.right;
      }
      if (target !== sessionStorage.getItem("editingTarget") || sessionStorage.getItem("activeTabIndex") !== tabIndex) {
        isInvisible = true;
      }
      const actualColor = isInvisible ? "#ffffff00" : color;
      setCursors(prevCursors => _objectSpread(_objectSpread({}, prevCursors), {}, {
        [clientId]: {
          relposition,
          cursorColor: actualColor,
          name: clientId
        }
      }));
    };
    websocket.onmessage = handleCursorMessage;

    // Cleanup the subscription on component unmount
    return () => {
      websocket.onmessage = null;
    };
  }, [websocket]);
  const clampPosition = (position, max, cursorSize) => {
    return Math.max(0, Math.min(position, max - cursorSize));
  };
  const cursorWidth = 20; // Define cursor width if needed
  const cursorHeight = 20; // Define cursor height if needed

  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0__.createElement(react__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, Object.values(cursors).map((member, index) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const clampedX = clampPosition(member.relposition.x, viewportWidth, cursorWidth);
    const clampedY = clampPosition(member.relposition.y, viewportHeight, cursorHeight);
    return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", {
      key: index,
      className: (_Cursors_module_css__WEBPACK_IMPORTED_MODULE_3___default().cursor),
      style: {
        top: "".concat(clampedY, "px"),
        left: "".concat(clampedX, "px")
      }
    }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0__.createElement(_CursorSvg_jsx__WEBPACK_IMPORTED_MODULE_2__["default"], {
      cursorColor: member.cursorColor
    }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", {
      style: {
        backgroundColor: member.cursorColor
      },
      className: (_Cursors_module_css__WEBPACK_IMPORTED_MODULE_3___default().cursorName)
    }, member.cursorColor === "#ffffff00" ? "" : member.name));
  }));
};


/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[5].use[1]!./node_modules/postcss-loader/src/index.js??ruleSet[1].rules[5].use[2]!./src/playground/index.css":
/*!***************************************************************************************************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[5].use[1]!./node_modules/postcss-loader/src/index.js??ruleSet[1].rules[5].use[2]!./src/playground/index.css ***!
  \***************************************************************************************************************************************************************************/
/***/ ((module, exports, __webpack_require__) => {

// Imports
var ___CSS_LOADER_API_IMPORT___ = __webpack_require__(/*! ../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
exports = ___CSS_LOADER_API_IMPORT___(false);
// Module
exports.push([module.id, "html,\nbody,\n.index_topheader_2Vzle {\n    /* probably unecessary, transitional until layout is refactored */\n    width: 100%; \n    margin: 0;\n\n    /* Setting min height/width makes the UI scroll below those sizes */\n    min-width: 1024px;\n    height: 100vh;\n\n    flex-direction: column;\n    display: flex;\n}\n\n.index_app_3Qs6X {\n    flex: 1;\n}\n\n.index_overlay_3O_3f {\n    pointer-events: none;\n    visibility: hidden;\n}\n\n.index_cursor_IXuDF {\n    visibility: visible;\n}\n\n/* @todo: move globally? Safe / side FX, for blocks particularly? */\n\n* { box-sizing: border-box; }\n", ""]);
// Exports
exports.locals = {
	"topheader": "index_topheader_2Vzle",
	"app": "index_app_3Qs6X",
	"overlay": "index_overlay_3O_3f",
	"cursor": "index_cursor_IXuDF"
};
module.exports = exports;


/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[5].use[1]!./node_modules/postcss-loader/src/index.js??ruleSet[1].rules[5].use[2]!./src/utils/Cursors.module.css":
/*!*******************************************************************************************************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[5].use[1]!./node_modules/postcss-loader/src/index.js??ruleSet[1].rules[5].use[2]!./src/utils/Cursors.module.css ***!
  \*******************************************************************************************************************************************************************************/
/***/ ((module, exports, __webpack_require__) => {

// Imports
var ___CSS_LOADER_API_IMPORT___ = __webpack_require__(/*! ../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
exports = ___CSS_LOADER_API_IMPORT___(false);
// Module
exports.push([module.id, ".Cursors-module_cursor_28g2_ {\r\n    position: absolute;\r\n    pointer-events: none;\r\n    z-index: 1000;\r\n    cursor: none;\r\n}\r\n\r\n.Cursors-module_cursorName_jhzeK {\r\n    padding: 0.5rem 1rem;\r\n    margin-left: 0.5rem;\r\n    border-radius: 9999px;\r\n    font-size: 0.875rem;\r\n    line-height: 1.25rem;\r\n    color: #fff;\r\n    white-space: nowrap;\r\n    pointer-events: none;\r\n}\r\n  ", ""]);
// Exports
exports.locals = {
	"cursor": "Cursors-module_cursor_28g2_",
	"cursorName": "Cursors-module_cursorName_jhzeK"
};
module.exports = exports;


/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[5].use[1]!./node_modules/postcss-loader/src/index.js??ruleSet[1].rules[5].use[2]!./src/utils/LiveCursors.module.css":
/*!***********************************************************************************************************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[5].use[1]!./node_modules/postcss-loader/src/index.js??ruleSet[1].rules[5].use[2]!./src/utils/LiveCursors.module.css ***!
  \***********************************************************************************************************************************************************************************/
/***/ ((module, exports, __webpack_require__) => {

// Imports
var ___CSS_LOADER_API_IMPORT___ = __webpack_require__(/*! ../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
exports = ___CSS_LOADER_API_IMPORT___(false);
// Module
exports.push([module.id, ".LiveCursors-module_liveCursorsContainer_2L9H8 {\r\n    width: 100%;\r\n    cursor: none;\r\n    display:flex;\r\n    justify-content: center;\r\n    align-items: center;\r\n    position: relative;\r\n    background-color: #ffffff;\r\n    height: 100%;\r\n  }\r\n  ", ""]);
// Exports
exports.locals = {
	"liveCursorsContainer": "LiveCursors-module_liveCursorsContainer_2L9H8"
};
module.exports = exports;


/***/ }),

/***/ "./src/playground/index.css":
/*!**********************************!*\
  !*** ./src/playground/index.css ***!
  \**********************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var content = __webpack_require__(/*! !!../../node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[5].use[1]!../../node_modules/postcss-loader/src/index.js??ruleSet[1].rules[5].use[2]!./index.css */ "./node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[5].use[1]!./node_modules/postcss-loader/src/index.js??ruleSet[1].rules[5].use[2]!./src/playground/index.css");

if(typeof content === 'string') content = [[module.id, content, '']];

var transform;
var insertInto;



var options = {"hmr":true}

options.transform = transform
options.insertInto = undefined;

var update = __webpack_require__(/*! !../../node_modules/style-loader/lib/addStyles.js */ "./node_modules/style-loader/lib/addStyles.js")(content, options);

if(content.locals) module.exports = content.locals;

if(false) {}

/***/ }),

/***/ "./src/utils/Cursors.module.css":
/*!**************************************!*\
  !*** ./src/utils/Cursors.module.css ***!
  \**************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var content = __webpack_require__(/*! !!../../node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[5].use[1]!../../node_modules/postcss-loader/src/index.js??ruleSet[1].rules[5].use[2]!./Cursors.module.css */ "./node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[5].use[1]!./node_modules/postcss-loader/src/index.js??ruleSet[1].rules[5].use[2]!./src/utils/Cursors.module.css");

if(typeof content === 'string') content = [[module.id, content, '']];

var transform;
var insertInto;



var options = {"hmr":true}

options.transform = transform
options.insertInto = undefined;

var update = __webpack_require__(/*! !../../node_modules/style-loader/lib/addStyles.js */ "./node_modules/style-loader/lib/addStyles.js")(content, options);

if(content.locals) module.exports = content.locals;

if(false) {}

/***/ }),

/***/ "./src/utils/LiveCursors.module.css":
/*!******************************************!*\
  !*** ./src/utils/LiveCursors.module.css ***!
  \******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var content = __webpack_require__(/*! !!../../node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[5].use[1]!../../node_modules/postcss-loader/src/index.js??ruleSet[1].rules[5].use[2]!./LiveCursors.module.css */ "./node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[5].use[1]!./node_modules/postcss-loader/src/index.js??ruleSet[1].rules[5].use[2]!./src/utils/LiveCursors.module.css");

if(typeof content === 'string') content = [[module.id, content, '']];

var transform;
var insertInto;



var options = {"hmr":true}

options.transform = transform
options.insertInto = undefined;

var update = __webpack_require__(/*! !../../node_modules/style-loader/lib/addStyles.js */ "./node_modules/style-loader/lib/addStyles.js")(content, options);

if(content.locals) module.exports = content.locals;

if(false) {}

/***/ }),

/***/ "?2dd4":
/*!*******************************************!*\
  !*** ./locale-data/complete.js (ignored) ***!
  \*******************************************/
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ "?d4c0":
/*!************************!*\
  !*** crypto (ignored) ***!
  \************************/
/***/ (() => {

/* (ignored) */

/***/ })

},
/******/ __webpack_require__ => { // webpackRuntimeModules
/******/ var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
/******/ __webpack_require__.O(0, ["vendors-node_modules_microbit_microbit-universal-hex_dist_esm5_universal-hex_js-node_modules_-e1a150","vendors-node_modules_core-js_core_object_js-node_modules_core-js_fn_array_includes_js-node_mo-7eb68d","src_containers_gui_jsx-src_lib_app-state-hoc_jsx-src_lib_hash-parser-hoc_jsx"], () => (__webpack_exec__("./src/playground/index.jsx")));
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ return __webpack_exports__;
/******/ }
]);
});
//# sourceMappingURL=gui.js.map