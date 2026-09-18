/**
 * Replaces {{VarName}} tokens. Unknown tokens are left untouched.
 * Usage: render("Hi {{ContactName}}", { ContactName: "Aarav" })
 */
export function render(template, variables = {}) {
    if (!template) return '';
    return template.replace(/{{\s*([\w.]+)\s*}}/g, (match, key) => {
        const value = variables[key];
        return value === undefined || value === null ? match : String(value);
    });
}

export function extractVariables(template) {
    const set = new Set();
    const re = /{{\s*([\w.]+)\s*}}/g;
    let m;
    while ((m = re.exec(template))) set.add(m[1]);
    return [...set];
}