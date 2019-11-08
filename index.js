const Octokit = require('@octokit/rest');
const Parser = require('markdown-parser');
require('dotenv').config();


// DONT DO THIS
console.oldLog = console.log;
console.log = function (value) {
  console.oldLog(value);
  return value;
};

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
    if (result.codes[0].code.includes('process.env.')) { 
      throw new Error('Violation')
    };

    let executedCode = eval(result.codes[0].code.replace(/\n,/igm))
    createComment(executedCode)
  })
})()