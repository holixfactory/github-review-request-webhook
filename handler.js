'use strict';

const { WebClient } = require('@slack/client');
const token = process.env.SLACK_TOKEN;
const githubSlackUserMap = JSON.parse(process.env.GITHUB_SLACK_USER_MAP || '{}');
const web = new WebClient(token);

/* eslint-disable no-param-reassign */

module.exports.githubReviewRequestWebhook = function (event, context, callback) {
  const pullRequestEvent = JSON.parse(event.body);
  if (pullRequestEvent.action === "review_requested") {
    const pullRequestUser = pullRequestEvent.pull_request.user.login;
    const pullRequestUserHtmlUrl = pullRequestEvent.pull_request.user.html_url;
    const html_url = pullRequestEvent.pull_request.html_url;
    const reviewers = (
      pullRequestEvent.pull_request.requested_reviewers
        .map(reviewer => reviewer.login)
        .filter(githubUser => githubUser in githubSlackUserMap)
        .map(githubUser => githubSlackUserMap[githubUser])
    );
    console.log(html_url);
    console.log(githubSlackUserMap);
    console.log(githubSlackUserMap);
    const postMessages = (
      reviewers
        .map(reviewer => web.chat.postMessage({
          channel: `@${reviewer}`,
          text: `<${pullRequestUserHtmlUrl}|@${pullRequestUser}>님에게\n${html_url}\n풀리퀘스트에 대한 리뷰 요청이 들어왔습니다.`
        }))
    );

    Promise.all(postMessages).then(() => {
      callback(null, {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "message": "PR nofication sended to send "
        })
      });
    });
  }
  console.log('JavaScript HTTP trigger function processed a request.');
  callback(null, {
    statusCode: 404,
    headers: { 'Content-Type': 'application/json' },
    body: '{"message": "No matched reviewers."}'
  });
};
