(function () {
    const TASK_CHAT_ENDPOINT = 'https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/task-chat';

    class ScratchCodeParser {
        constructor() {
            this.isRunning = false;
            this.requestTimeoutMs = 12000;
        }

        getScratchFrameWindow() {
            const frame = document.getElementById('main-stream');
            if (!frame) return null;
            return frame.contentWindow || null;
        }

        countBlocksInChunk(chunk) {
            if (!chunk || !chunk.chunkText) return 0;
            const text = String(chunk.chunkText).trim();
            if (!text) return 0;
            return text.split(' -> ').length;
        }

        getAssignedTasks() {
            // Get all tasks assigned to the current user
            if (!window.tasksManager || !window.tasksManager.studentTasks) return [];
            
            const allAssigned = [];
            Object.values(window.tasksManager.studentTasks).forEach(studentTaskSet => {
                if (studentTaskSet && Array.isArray(studentTaskSet.assigned)) {
                    allAssigned.push(...studentTaskSet.assigned);
                }
            });
            return allAssigned;
        }

        findRelatedTasks(chunk) {
            // Find tasks that relate to this chunk based on keywords in task title
            if (!chunk || !chunk.chunkText) return [];
            
            const chunkText = String(chunk.chunkText).toLowerCase();
            const assignedTasks = this.getAssignedTasks();
            
            return assignedTasks.filter(task => {
                if (!task || !task.title) return false;
                const taskTitle = String(task.title).toLowerCase();
                
                // Extract keywords from chunkText (block types)
                const chunkKeywords = chunkText.split(' -> ').map(s => s.toLowerCase().trim());
                
                // Check if any chunk keyword appears in task title
                return chunkKeywords.some(keyword => 
                    keyword && taskTitle.includes(keyword)
                );
            });
        }

        requestCodeChunks(frameWindow) {
            return new Promise((resolve, reject) => {
                const requestId = `chunks_${Date.now()}_${Math.random().toString(16).slice(2)}`;

                const timeoutId = setTimeout(() => {
                    window.removeEventListener('message', onMessage);
                    reject(new Error('Timed out waiting for code chunks from VM.'));
                }, this.requestTimeoutMs);

                const onMessage = (event) => {
                    const data = event && event.data;
                    if (!data || typeof data !== 'object') return;
                    if (data.type !== 'codeChunks') return;
                    if (data.requestId !== requestId) return;

                    clearTimeout(timeoutId);
                    window.removeEventListener('message', onMessage);

                    const chunks = Array.isArray(data.chunks) ? data.chunks : [];
                    resolve(chunks);
                };

                window.addEventListener('message', onMessage);
                frameWindow.postMessage({
                    type: 'collectCodeChunks',
                    requestId
                }, '*');
            });
        }

        async explainChunkWithLLM(chunk, index, total, contextTitle, relatedTasks) {
            const chunkText = (chunk && chunk.chunkText ? String(chunk.chunkText) : '').trim();
            const safeChunkText = chunkText || 'No code text available for this chunk.';
            const contextLine = contextTitle ? `Task context: ${contextTitle}. ` : '';
            
            // Build task mention if there are related tasks
            let taskMention = '';
            if (relatedTasks && relatedTasks.length > 0) {
                const taskTitles = relatedTasks.map(t => t.title).join(', ');
                taskMention = ` This relates to your tasks: ${taskTitles}.`;
            }

            console.log(contextLine, safeChunkText, taskMention);

            const body =
                'You are helping students understand Scratch code. ' +
                contextLine +
                `Explain chunk ${index + 1} of ${total} in one short, clear note (max 20 words). ` +
                'Avoid markdown, bullet points, and code fences. ' +
                taskMention +
                `Code chunk: ${safeChunkText}`;

            const response = await fetch(TASK_CHAT_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain'
                },
                body
            });

            if (!response.ok) {
                throw new Error(`Task chat request failed with status ${response.status}`);
            }

            const data = await response.json();
            const raw = (data && (data.response || data.message)) ? (data.response || data.message) : '';
            const text = String(raw).trim();
            if (!text) {
                return 'This chunk controls part of your Scratch program flow.';
            }

            return text.slice(0, 220);
        }

        async attachNoteToChunk(frameWindow, chunk, noteText) {
            if (!chunk || !chunk.blockId) return;

            frameWindow.postMessage({
                type: 'highlightBlock',
                blockId: chunk.blockId,
                durationMs: 900,
                noteText
            }, '*');
        }

        getContextTitle() {
            if (window.tasksManager && window.tasksManager.selectedTask && window.tasksManager.selectedTask.title) {
                return window.tasksManager.selectedTask.title;
            }
            if (window.tasksManager && window.tasksManager.taskInHelpChat && window.tasksManager.taskInHelpChat.title) {
                return window.tasksManager.taskInHelpChat.title;
            }
            return '';
        }

        async explainScratchBlocks() {
            if (this.isRunning) {
                return;
            }

            const frameWindow = this.getScratchFrameWindow();
            if (!frameWindow) {
                return;
            }

            this.isRunning = true;

            try {
                const chunks = await this.requestCodeChunks(frameWindow);
                if (!chunks.length) {
                    alert('No Scratch code chunks found yet!');
                    return;
                }

                // Filter chunks to only those with more than 3 blocks
                const eligibleChunks = chunks.filter(chunk => this.countBlocksInChunk(chunk) > 3);
                
                if (!eligibleChunks.length) {
                    alert('No chunks with more than 3 blocks found!');
                    return;
                }

                const contextTitle = this.getContextTitle();

                for (let i = 0; i < eligibleChunks.length; i++) {
                    const chunk = eligibleChunks[i];
                    const blockCount = this.countBlocksInChunk(chunk);
                    const relatedTasks = this.findRelatedTasks(chunk);
                    
                    let noteText;

                    try {
                        noteText = await this.explainChunkWithLLM(chunk, i + 1, eligibleChunks.length, contextTitle, relatedTasks);
                    } catch (error) {
                        console.error('Failed to explain chunk with LLM:', error);
                        noteText = `Chunk ${i + 1} (${blockCount} blocks): This script handles a piece of your project logic.`;
                    }

                    await this.attachNoteToChunk(frameWindow, chunk, noteText);
                }

            } catch (error) {
                console.error('Explain Scratch Blocks failed:', error);
            } finally {
                this.isRunning = false;
            }
        }
    }

    window.scratchParser = new ScratchCodeParser();
})();
