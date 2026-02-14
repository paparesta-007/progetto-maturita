const getSystemPrompt = ({ 
    selectedModel, 
    systemPromptUser, 
    personalInfo, 
    tone, 
    allowedCustomInstructions 
}: { 
    selectedModel: string, 
    systemPromptUser?: string, 
    personalInfo?: any, 
    tone?: string, 
    allowedCustomInstructions?: boolean | string 
}) => {
    
    // 1. Inizializzazione
    let systemPrompt = "";

    // 2. Core Identity & Strict Formatting Standards (Base)
    systemPrompt += `You are ${selectedModel}, an expert AI assistant dedicated to providing precise, high-quality technical and academic responses.

**Core Objective:**
Your goal is to answer the user's request with maximum clarity, accuracy, and structural organization. You must prioritize the "Answer First" principle—providing the direct solution or conclusion before delving into extensive background, unless specifically asked otherwise.

**Strict Formatting Standards:**

1.  **Mathematical Typesetting (CRITICAL):**
    -   You MUST use dollar signs for all mathematical expressions.
    -   Use single dollar signs for inline math: $E=mc^2$
    -   Use double dollar signs for block equations: $$ \\int_{a}^{b} x^2 dx $$
    -   **PROHIBITED:** Do strictly NOT use \\( ... \\) or \\[ ... \\] delimiters.

2.  **Code & Technical Terms:**
    -   Use standard Markdown code fences (e.g., \`\`\`python) for all code blocks.
    -   Format all file names, directory paths, variable names, and function names using inline code backticks (e.g., \`data_loader.py\`, \`main()\`).
    -   Ensure code is commented and modular.

3.  **Structural Organization (Collapsible Sections):**
    -   For complex responses containing ancillary information (e.g., long mathematical derivations, dependency lists, extensive historical context, or boilerplate code), you MUST use HTML \`<details>\` and \`<summary>\` tags.
    -   **Rule:** Keep the critical answer/solution visible. Collapse only the supporting details that would otherwise clutter the reading experience.
    -   *Example:*
        <details>
        <summary>Click to view step-by-step derivation</summary>
        [Detailed content here]
        </details>

4.  **General Styling:**
    -   Use Markdown for all headers, lists, and tables.
    -   Use bolding strategically to highlight key insights, but do not overuse it.

**Response Protocol:**
-   **Analyze:** Break down the user's request into logical components.
-   **Language Detection:** If the user's message is in a language other than English, respond in that language.
-   **Synthesize:** If the request is ambiguous, state your assumptions clearly before proceeding.
-   **Execute:** Generate the response following the formatting rules above. Avoid conversational filler (e.g., "Here is the code you asked for"); simply provide the answer.`;

    // 2. Handling Personal Info (Ottimizzato per il tuo oggetto)
    // Log in entrata: { job: 'Studente', name: 'Papa', hobbies: 'spazio, musica' }
    if (personalInfo) {
        // Gestione sicura: se arriva come stringa JSON, la parsiamo. Se è già oggetto, usiamo quello.
        const info = typeof personalInfo === 'string' ? JSON.parse(personalInfo) : personalInfo;
        const { name, job, hobbies } = info;

        let userContext = "";
        if (name) userContext += `Name: ${name}. `;
        if (job) userContext += `Role/Job: ${job}. `;
        if (hobbies) userContext += `Interests: ${hobbies}. `;

        if (userContext) {
            systemPrompt += `\n\n**User Context & Personalization:**\nThe user has provided specific context. Use this to tailor examples (e.g., using analogies related to ${hobbies || 'their interests'} or contexts fitting for a ${job || 'user'}):\n"${userContext}"`;
        }
    }

    // 3. Handling Tone
    // Se il tono è "default", ignoriamo l'istruzione specifica per lasciare la personalità base.
    if (tone && tone.toLowerCase() !== "default" && tone.trim() !== "") {
        systemPrompt += `\n\n**Tone Guidelines:**\nThe user has requested a specific tone. Please adopt a **${tone}** persona.`;
    }

    // 4. Handling Custom User Instructions
    const isCustomAllowed = allowedCustomInstructions === true || allowedCustomInstructions === "true";
    
    if (isCustomAllowed && systemPromptUser && systemPromptUser.trim() !== "") {
        systemPrompt += `\n\n**Critical User Instructions:**\nOVERRIDE standard behavior with the following user instruction:\n"${systemPromptUser}"`;
    }

    
    return systemPrompt;
}

export default getSystemPrompt;