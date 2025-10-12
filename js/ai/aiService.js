const aiService = {
    apiKey: 'YOUR_OPENAI_API_KEY_HERE',

    async chatCompletion(messages) {
        try {
            // Get project data from the global window object
            const projectInfo = window.projectData;
            
            // Create a detailed project context
            const projectContext = `
Project Description: ${projectInfo.description}

Required Interests: ${projectInfo.required_interests.join(', ')}

Team Members:
${projectInfo.team.members.map(member => 
    `- ${member.name} (${member.role}): ${member.interests.join(', ')}`
).join('\n')}

Current Tasks:
${projectInfo.tasks.map(task => 
    `- ${task.title} (${task.status}): ${task.description}
  Assigned to: ${task.assignedTo || 'Unassigned'}
  Required Interest: ${task.requiredInterest}`
).join('\n')}
            `;

            const messagesWithSystem = [
                {
                    role: "system",
                    content: projectInfo.system_instructions
                },
                {
                    role: "system",
                    content: projectContext
                },
                ...messages
            ];

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: messagesWithSystem,
                    response_format: { type: "json_object" },
                    temperature: 0.7,
                    max_tokens: 1000
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;
            
            // Parse the JSON response
            try {
                const parsedResponse = JSON.parse(content);
                return {
                    role: 'assistant',
                    content: parsedResponse.answer,
                    buttons: parsedResponse.buttons || []
                };
            } catch (e) {
                console.error('Error parsing AI response:', e);
                console.log(content)
                return {
                    role: 'assistant',
                    content: 'Sorry, there was an error processing the response.',
                    buttons: []
                };
            }
        } catch (error) {
            console.error('Error in chat completion:', error);
            throw error;
        }
    }
};

window.aiService = aiService;

// #Todo: Add more AI-related methods here
// For example:
// - textCompletion()
// - imageGeneration()
// - codeCompletion()
// etc. 