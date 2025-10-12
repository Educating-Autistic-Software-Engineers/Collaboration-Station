const projectData = {
    system_instructions: `
    You are Coby, a helpful AI partner in a collaborative coding environment. 
    Your responses should be clear, concise, and focused on helping users with their coding tasks.
    Dont say some filling words, just answer the user's question.
    When suggesting code changes, explain your reasoning and consider best practices. 
    You should not give them the final answer! Your answer should be short and to the point. 
    Use formatted text in your responses. Use emojies to make your responses more engaging. 
    Be short, directly respond to user requests. Do not return any code.

    If user is not asigned to any task, you should briefly explain the project and provide list of required skills in buttons.
    If user selects a skill from the list, you should provide the task list related to the skill which are unasigned to anyone.

    You answers should be in json format below:
    {
        "answer": "string",
        "buttons": [{name: "button1", description: "button1 description"}, ...]

    }
    Buttons are shortcuts related to the project (description, tasks, team, required skills, etc.) in which user can click on it and get more information from you. 

    The current user is: Sajad



    `,
    description: `Project Description:
Your group will build a simple Obstacle Dodger game using block-based coding. The player controls a character that moves left and right to avoid falling obstacles. The goal is to survive as long as possible while the game gets faster or harder over time.

The game must include:
- A player character controlled by left/right arrow keys
- Falling obstacles that reset when they reach the bottom
- A score that increases over time or when the player avoids obstacles
- A game over screen when the player touches an obstacle
- Sound effects or simple animations for feedback

You will:
- Build the game logic using block coding
- Design the sprites and background
- Test the game and fix any bugs
- Present the game and explain what each member contributed

Work as a team. All code and design must be your own. Submit and present the game through the Collaboration Station.`,


required_interests: ["Game Design", "Block Coding", "Animation", "Project Management"],

    tasks: [
        {
            id: 2,
            title: "Player Character",
            status: "completed",
            description: "Design the player character",
            assignedTo: "John",
            requiredInterest: "Game Design"
        },
        {
            id: 3,
            title: "Obstacle System",
            status: "completed",
            description: "Implement falling obstacles and add collision detection",
            assignedTo: "Sarah",
            requiredInterest: "Block Coding"
        },
        {
            id: 4,
            title: "Scoring System",
            status: "in_progress",
            description: "Add a score variable and update it based on time or obstacle avoidance",
            assignedTo: "Mike",
            requiredInterest: "Block Coding"
        },
        {
            id: 5,
            title: "Game Over Screen",
            status: "in_progress",
            description: "Create a Game Over screen with a message and restart button",
            assignedTo: "Emma",
            requiredInterest: "Game Design"
        },
        {
            id: 6,
            title: "Character Sound Effects",
            status: "in_progress",
            description: "Add sound effects for player actions like movement or collision",
            assignedTo: "John",
            requiredInterest: "Animation"
        },
        {
            id: 7,
            title: "Obstacle Sound Effects",
            status: "not_started",
            description: "Add sound effects for falling obstacles and collision impact",
            requiredInterest: "Animation"
        },
        {
            id: 8,
            title: "Movement Coding",
            status: "not_started",
            description: "Implement block coding for left and right movement of player",
            assignedTo: "John",
            requiredInterest: "Block Coding"
        },
        {
            id: 9,
            title: "Obstacle Movement Coding",
            status: "not_started",
            description: "Implement code blocks for obstacle motion and reset behavior",
            assignedTo: "Sarah",
            requiredInterest: "Block Coding"
        },
        {
            id: 10,
            title: "Background Design",
            status: "not_started",
            description: "Design the visual background for the game",
            assignedTo: "Emma",
            requiredInterest: "Animation"
        },
        {
            id: 11,
            title: "Score Display UI",
            status: "not_started",
            description: "Create a visual score counter on screen using block UI elements",
            assignedTo: "Mike",
            requiredInterest: "Block Coding"
        },
        {
            id: 12,
            title: "Test Player Movement",
            status: "not_started",
            description: "Verify that player movement behaves as expected across different runs",
            requiredInterest: "Project Management"
        },
        {
            id: 13,
            title: "Test Obstacle Behavior",
            status: "not_started",
            description: "Ensure obstacles fall consistently and reset properly",
            requiredInterest: "Project Management"
        },
        {
            id: 14,
            title: "Test Scoring Logic",
            status: "not_started",
            description: "Confirm that score increments correctly and displays properly",
            requiredInterest: "Project Management"
        },
        {
            id: 15,
            title: "Test Game Over Logic",
            status: "not_started",
            description: "Check if game ends when the player is hit and restart works",
            requiredInterest: "Project Management"
        }
    ]
,

    team: {
        members: [
            {
                name: "John",
                role: "Developer",
                tasks: [2],
                interests: ["Game Design", "Block Coding"]
            },
            {
                name: "Sarah",
                role: "Developer",
                tasks: [3],
                interests: ["Game Design", "Block Coding"]
            },
            {
                name: "Mike",
                role: "Developer",
                tasks: [4],
                interests: ["Game Design", "Block Coding"]
            },
            {
                name: "Emma",
                role: "Developer",
                tasks: [5],
                interests: ["Game Design", "Animation"]
            },
            {
                name: "Sajad",
                role: "Project Manager",
                tasks: [1],
                interests: ["Project Management"]
            }
        ],
    },

    // Response templates for LLM
    templates: {
        taskAnalysis: `{
    "taskId": number,
    "analysis": {
        "complexity": "low|medium|high",
        "estimatedTime": "string",
        "dependencies": ["taskId"],
        "requiredSkills": ["string"],
        "potentialChallenges": ["string"]
    }
}`,
        codeReview: `{
    "codeBlock": "string",
    "review": {
        "quality": "good|needs_improvement|poor",
        "suggestions": ["string"],
        "bestPractices": ["string"],
        "potentialIssues": ["string"]
    }
}`,
        collaboration: `{
    "type": "suggestion|question|feedback",
    "content": "string",
    "relatedTo": {
        "taskId": number,
        "memberName": "string"
    },
    "priority": "low|medium|high"
}`
    }
};

// Make it available globally
window.projectData = projectData; 