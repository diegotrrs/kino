#!/usr/bin/env node
const fs = require("fs").promises;

function normalizeImportStatement(importStr, eol) {
  // Remove extra whitespace within single lines but preserve line breaks
  const lines = importStr.split(/\r?\n/);
  const normalizedLines = lines
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line);

  // Check if this is a multi-import with braces that should be formatted as multi-line
  const singleLineStr = normalizedLines.join(" ");
  const multiImportMatch = singleLineStr.match(
    /^(\s*(?:import|export)\s*(?:type\s*)?)\s*\{([^}]+)\}\s*(from\s+.+;?)$/
  );

  if (multiImportMatch) {
    const prefix = multiImportMatch[1].trim();
    const imports = multiImportMatch[2];
    const fromClause = multiImportMatch[3];

    const importList = imports
      .split(",")
      .map((imp) => imp.trim())
      .filter((imp) => imp);

    // If there are multiple imports, format as multi-line
    if (importList.length > 1) {
      const formattedImports = importList
        .map((imp) => `  ${imp}`)
        .join(`,${eol}`);
      return `${prefix} {${eol}${formattedImports}${eol}} ${fromClause}`;
    } else {
      // Single import, keep it on one line
      return `${prefix} { ${importList[0]} } ${fromClause}`;
    }
  }

  // Handle mixed imports: import default, { named } from 'module'
  const mixedImportMatch = singleLineStr.match(
    /^(\s*import\s*(?:type\s*)?)\s*([^,{]+),\s*\{([^}]+)\}\s*(from\s+.+;?)$/
  );

  if (mixedImportMatch) {
    const prefix = mixedImportMatch[1].trim();
    const defaultImport = mixedImportMatch[2].trim();
    const namedImports = mixedImportMatch[3];
    const fromClause = mixedImportMatch[4];

    const namedImportList = namedImports
      .split(",")
      .map((imp) => imp.trim())
      .filter((imp) => imp);

    // Keep as single mixed import statement, format named imports as multi-line if multiple
    if (namedImportList.length > 1) {
      const formattedImports = namedImportList
        .map((imp) => `  ${imp}`)
        .join(`,${eol}`);
      return `${prefix} ${defaultImport}, {${eol}${formattedImports}${eol}} ${fromClause}`;
    } else {
      return `${prefix} ${defaultImport}, { ${namedImportList[0]} } ${fromClause}`;
    }
  }

  // For other patterns, just normalize whitespace and return as single statement
  return normalizedLines.join(" ");
}

async function alignFile(file) {
  let content = await fs.readFile(file, "utf8");
  const eol = content.includes("\r\n") ? "\r\n" : "\n";
  // Match each import-block (single or multi-line) by
  // looking for a leading "import" and the trailing semicolon.
  // We use multiline mode (m) so ^ sees the line start.
  const IMPORT_RE = /^(\s*(?:import|(?:export [*{]))[\s\S]*?;)/gm;
  let matches = [];
  for (let m of content.matchAll(IMPORT_RE)) {
    const start = m.index;
    if (
      matches.length &&
      !/^\s*$/.test(content.slice(matches[matches.length - 1].end, start))
    ) {
      break;
    }
    matches.push({
      raw: m[1],
      start: m.index,
      end: m.index + m[1].length,
    });
  }
  if (matches.length === 0) return; // nothing to do

  // Process each import to normalize and separate imports from exports
  let processedImports = [];
  let processedExports = [];
  for (let match of matches) {
    const normalizedImport = normalizeImportStatement(match.raw, eol);
    const isExport = match.raw.trim().startsWith("export");

    if (isExport) {
      processedExports.push({
        ...match,
        raw: normalizedImport,
      });
    } else {
      processedImports.push({
        ...match,
        raw: normalizedImport,
      });
    }
  }

  // Find the maximal prefix-length before "from" among all imports and exports
  let maxPrefix = 0;
  const allStatements = [...processedImports, ...processedExports];
  for (let { raw } of allStatements) {
    // For multi-line imports, check the last line for "from"
    const lines = raw.split(/\r?\n/);
    const lastLine = lines[lines.length - 1];
    let idx = lastLine.indexOf("from");
    if (idx >= 0) {
      let prefix = lastLine.slice(0, idx);
      if (prefix.length > maxPrefix) maxPrefix = prefix.length;
    }
  }

  // Check if an import is a TypeScript import assignment (import member = module.member)
  function isImportAssignment(importStr) {
    // TypeScript import assignments have the pattern: import name = module.member
    // They don't have a "from" keyword
    return /^\s*import\s+\w+\s*=\s*[\w.]+\s*;?/.test(importStr);
  }

  // Extract source from import statement for sorting
  function extractSource(importStr) {
    const lines = importStr.split(/\r?\n/);
    const lastLine = lines[lines.length - 1];
    const fromMatch = lastLine.match(/from\s+['"]([^'"]+)['"]/);
    return fromMatch ? fromMatch[1] : "";
  }

  // Sort imports and exports separately by source alphabetically, with relative imports and import assignments last
  const sortStatements = (statements) => {
    return statements.sort((a, b) => {
      const isAssignmentA = isImportAssignment(a.raw);
      const isAssignmentB = isImportAssignment(b.raw);

      // If one is an import assignment and the other isn't, put import assignments last
      if (isAssignmentA && !isAssignmentB) return 1;
      if (!isAssignmentA && isAssignmentB) return -1;

      // If both are import assignments, sort alphabetically
      if (isAssignmentA && isAssignmentB) {
        return a.raw.localeCompare(b.raw);
      }

      // For non-namespace imports, use existing sorting logic
      const sourceA = extractSource(a.raw);
      const sourceB = extractSource(b.raw);

      const isRelativeA = sourceA.startsWith(".");
      const isRelativeB = sourceB.startsWith(".");

      // If one is relative and the other isn't, put the non-relative first
      if (isRelativeA && !isRelativeB) return 1;
      if (!isRelativeA && isRelativeB) return -1;

      // Both are relative or both are non-relative, sort alphabetically
      return sourceA.localeCompare(sourceB);
    });
  };

  sortStatements(processedImports);
  sortStatements(processedExports);

  // Build aligned imports and exports separately
  const buildAlignedStatements = (statements) => {
    let rebuiltStatements = [];
    for (let { raw } of statements) {
      const lines = raw.split(/\r?\n/);
      const lastLineIdx = lines.length - 1;

      // Process each line, but only align the last line (which contains "from")
      const processedLines = lines.map((line, idx) => {
        if (idx === lastLineIdx) {
          let fromIdx = line.indexOf("from");
          if (fromIdx >= 0) {
            let prefix = line.slice(0, fromIdx);
            let rest = line.slice(fromIdx);
            let pad = " ".repeat(maxPrefix - prefix.length);
            return prefix + pad + rest;
          }
        }
        return line;
      });

      rebuiltStatements.push(processedLines.join(eol));
    }
    return rebuiltStatements;
  };

  const rebuiltImports = buildAlignedStatements(processedImports);
  const rebuiltExports = buildAlignedStatements(processedExports);

  // Find the range of all imports to replace
  if (matches.length === 0) return;
  const firstMatch = matches[0];
  const lastMatch = matches[matches.length - 1];
  const startPos = firstMatch.start;
  const endPos = lastMatch.end;

  // Combine imports and exports with a blank line between them if both exist
  let combinedStatements = [];
  if (rebuiltImports.length > 0) {
    combinedStatements.push(...rebuiltImports);
  }
  if (rebuiltExports.length > 0) {
    if (rebuiltImports.length > 0) {
      combinedStatements.push(""); // Add blank line between imports and exports
    }
    combinedStatements.push(...rebuiltExports);
  }

  // Replace entire import/export block with sorted and aligned statements
  let out =
    content.slice(0, startPos) +
    combinedStatements.join(eol) +
    content.slice(endPos);
  if (out !== content) {
    await fs.writeFile(file, out, "utf8");
    console.log("Aligned:", file);
  }
}

async function main() {
  const files = process.argv.slice(2);
  await Promise.all(files.map(alignFile));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
