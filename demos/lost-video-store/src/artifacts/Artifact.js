export function defineArtifact(config) {
  const required = ['id','name','subtitle','description','interaction','clue','storyBeat','visual'];
  for (const field of required) if (!config[field]) throw new Error(`Artifact missing ${field}`);
  return Object.freeze({ ...config });
}
