'use strict';

const { WebClient } = require('@slack/client');
const token = process.env.SLACK_TOKEN;
const githubSlackUserMap = JSON.parse(process.env.GITHUB_SLACK_USER_MAP || '{}');
const web = new WebClient(token);

/* eslint-disable no-param-reassign */

module.exports.githubReviewRequestWebhook = async function (event, context, callback) {
  const pullRequestEvent = JSON.parse(event.body);
  console.log(githubSlackUserMap);
  console.log(pullRequestEvent.action);
  if (pullRequestEvent.action === "review_requested") {
    const reviewee = pullRequestEvent.pull_request.user.login;
    const reviewee_icon_url = pullRequestEvent.pull_request.user.avatar_url;
    const reviewee_html_url = pullRequestEvent.pull_request.user.html_url;
    const html_url = pullRequestEvent.pull_request.html_url;
    const reviewers = (
      pullRequestEvent.pull_request.requested_reviewers
        .map(reviewer => reviewer.login)
        .filter(githubUser => githubUser in githubSlackUserMap)
        .map(githubUser => githubSlackUserMap[githubUser])
    );
    console.log(reviewers);
    const userList = await web.users.list();
    const reviewerIds = reviewers.map(
      reviewer => userList.members.find(
        member => member.real_name === reviewer
      ).id
    );
    console.log(reviewerIds);
    const title = pullRequestEvent.pull_request.title;
    const postMessages = (
      reviewerIds
        .map(reviewerId => web.chat.postMessage({
          channel: reviewerId,
          username: `${reviewee}님의 리뷰 요청`,
          icon_url: reviewee_icon_url,
          text: `*${title}*\n${html_url}\n풀리퀘스트에 대한 리뷰 요청이 들어왔습니다.\n`
        }))
    );

    return Promise.all(postMessages).then(() => {
      callback(null, {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "message": "PR nofication sended to reviewers"
        })
      });
    });
  }
  callback(null, {
    statusCode: 404,
    headers: { 'Content-Type': 'application/json' },
    body: '{"message": "No matched reviewers."}'
  });
};
