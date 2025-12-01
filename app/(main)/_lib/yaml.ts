import yaml from 'js-yaml';

/**
 * Convert a JavaScript object to YAML string
 */
export function toYaml(obj: Record<string, unknown>): string {
  return yaml.dump(obj, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
  });
}

/**
 * Parse a YAML string to a JavaScript object.
 * Note: js-yaml 4.x uses DEFAULT_SCHEMA by default which is safe
 * and does not execute arbitrary JavaScript code.
 */
export function fromYaml(yamlString: string): Record<string, unknown> {
  const result = yaml.load(yamlString);
  if (typeof result !== 'object' || result === null) {
    return {};
  }
  return result as Record<string, unknown>;
}
