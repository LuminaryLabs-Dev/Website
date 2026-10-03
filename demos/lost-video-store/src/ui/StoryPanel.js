export function revealClue(node, artifact){ node.innerHTML = `<strong>CLUE RECOVERED</strong><p>${artifact.clue}</p><small>${artifact.storyBeat}</small>`; }
