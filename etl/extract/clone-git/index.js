const fs = require("fs");
const path = require("path");
const { clone, checkout, init, fetch } = require("isomorphic-git");
const { promisify } = require("util");

const writeFile = promisify(fs.writeFile);

async function handler(inputs) {
  const tempDir = process.env.TMP_DIR || "/tmp";
  const repoPath = path.join(tempDir, `repo-${Date.now()}`);

  try {
    // Initialize an empty git repository
    await init({ fs, dir: repoPath });

    // Clone the repository
    await clone({
      fs,
      dir: repoPath,
      url: inputs.repoUrl,
      singleBranch: true,
      depth: 1,
      onAuth: (url, auth) => {
        if (inputs.privateToken) {
          return { ...auth, username: inputs.privateToken };
        }
      },
    });

    // Fetch all commits from the remote repository
    await fetch({
      fs,
      dir: repoPath,
      url: inputs.repoUrl,
      ref: inputs.ref || "HEAD", // Fetch the default branch or the specified ref
      depth: 1,
      singleBranch: true,
      onAuth: (url, auth) => {
        if (inputs.privateToken) {
          return { ...auth, username: inputs.privateToken };
        }
      },
    });

    const finalPath = inputs.path ? path.join(repoPath, inputs.path) : repoPath;

    // If a ref is specified, attempt to checkout that ref.
    if (inputs.ref) {
      await checkout({ fs, dir: repoPath, ref: inputs.ref });
    }

    return { status: "Repository cloned successfully.", repoCode: finalPath };
  } catch (error) {
    console.error("Error cloning repository:", error);
    return { status: "Failed to clone repository.", repoCode: "" };
  }
}

module.exports = { handler };

// Example function call (commented out)
// handler({
//   repoUrl: 'https://github.com/nodegit/nodegit',
//   path: '', // Optional, defaults to the root of the repository
//   ref: 'master', // Optional
// }).then((output) => console.log(output));
