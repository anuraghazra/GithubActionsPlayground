const Octokit = require('@octokit/rest');
const Parser = require('markdown-parser');
const { VM } = require('vm2');

require('dotenv').config();

// initialize VM
const vm = new VM({
  timeout: 1000,
  sandbox: {},
  eval: false
});

// DONT DO THIS
const consoleOverwriteScript = `
console.oldLog = console.log;
console.log = function (value) {
  console.oldLog(value);
  return value;
};
`

// default configs
let owner = 'anuraghazra';
let repo = 'GithubActionsPlayground';

// initialize contructors
const parser = new Parser();
const octokit = new Octokit({
  auth: process.env.OCTOCAT_KEY
});


// get data
(async () => {
  const { data: issuesRes } = await octokit.issues.listForRepo({
    owner,
    repo
  })

  let issueNumber = issuesRes[0].number
  let issueBody = issuesRes[0].body

  async function createComment(msg) {
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: `**Code executed [bot]:**\n\n\`\`\`bash\n${JSON.stringify(msg)}\n\`\`\``
    })
  }

  // parse markdown
  parser.parse(issueBody, function (err, result) {
    if (err) throw new Error(err);

    let code = result.codes[0].code.replace(/\n,/igm)
    let res = vm.run(`${consoleOverwriteScript}\n${code}`)

    createComment(res)
  })
})()