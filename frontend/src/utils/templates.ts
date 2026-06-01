export function extractVariables(code: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const variables = new Set<string>();
  let match;

  while ((match = regex.exec(code)) !== null) {
    variables.add(match[1]);
  }

  return Array.from(variables);
}

export function replaceVariables(code: string, variables: Record<string, string>): string {
  return code.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return variables[key] !== undefined ? variables[key] : `{{${key}}}`;
  });
}
