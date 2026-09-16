(function (root) {
  const graph = {
    A: ["B", "C"],
    B: ["A", "D", "E"],
    C: ["A", "F"],
    D: ["B"],
    E: ["B", "G"],
    F: ["C", "H"],
    G: ["E"],
    H: ["F"],
  };
  function trace(mode = "bfs", start = "A") {
    if (!["bfs", "dfs"].includes(mode) || !graph[start])
      throw new Error("Invalid search");
    const frontier = [start],
      seen = new Set([start]),
      visited = [],
      parents = { [start]: null };
    const frames = [
      {
        current: null,
        frontier: [start],
        visited: [],
        parents: { ...parents },
      },
    ];
    while (frontier.length) {
      const current = frontier.shift();
      visited.push(current);
      const next = graph[current].filter((n) => !seen.has(n));
      next.forEach((n) => {
        seen.add(n);
        parents[n] = current;
      });
      if (mode === "bfs") frontier.push(...next);
      else frontier.unshift(...next);
      frames.push({
        current,
        frontier: [...frontier],
        visited: [...visited],
        parents: { ...parents },
      });
    }
    return frames;
  }
  const samples = [
    { score: 0.95, actual: 1 },
    { score: 0.82, actual: 1 },
    { score: 0.7, actual: 0 },
    { score: 0.64, actual: 1 },
    { score: 0.5, actual: 0 },
    { score: 0.4, actual: 1 },
    { score: 0.28, actual: 0 },
    { score: 0.12, actual: 0 },
  ];
  function classify(threshold) {
    let tp = 0,
      fp = 0,
      tn = 0,
      fn = 0;
    for (const s of samples) {
      const positive = s.score >= threshold;
      if (positive && s.actual) tp++;
      else if (positive) fp++;
      else if (s.actual) fn++;
      else tn++;
    }
    return {
      tp,
      fp,
      tn,
      fn,
      precision: tp + fp ? tp / (tp + fp) : null,
      recall: tp / (tp + fn),
      accuracy: (tp + tn) / samples.length,
    };
  }
  root.AlgorithmModel = { graph, trace, samples, classify };
})(window);
