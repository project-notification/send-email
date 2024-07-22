import { SQSHandler, SQSEvent } from 'aws-lambda';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

export const handler: SQSHandler = async (event: SQSEvent) => {
  const body = event.Records[0]!.body;
  const message = JSON.parse(body) as ReservationMessage;

  const sesClient = new SESClient();

  const githubRepoUrl = 'https://github.com/project-notification/readme/issues';

  const htmlBody = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4a4a4a;">새로운 프로젝트 알림</h1>
          <p>안녕하세요,</p>
          <p>새로운 프로젝트가 등록되었습니다:</p>
          <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px;">
            <h2 style="color: #2c3e50; margin-top: 0;">${message.title}</h2>
            <p>자세한 내용을 보려면 아래 링크를 클릭하세요:</p>
            <a href="${
              message.url
            }" style="display: inline-block; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px;">프로젝트 보기</a>
          </div>
          ${
            message.topics
              ? `
          <div style="margin-top: 20px;">
            <p>관련 주제:</p>
            <ul>
              ${message.topics.map((topic) => `<li>${topic}</li>`).join('')}
            </ul>
          </div>
          `
              : ''
          }
          <p style="margin-top: 20px;">이 알림이 도움이 되셨기를 바랍니다.</p>
          <div style="margin-top: 30px; padding: 15px; background-color: #e7f3fe; border-left: 5px solid #2196F3; border-radius: 4px;">
            <p><strong>알림 구독 해제 방법:</strong></p>
            <p>더 이상 이메일 알림을 받지 않으려면, 아래 GitHub 저장소에서 귀하의 이슈를 닫아주세요:</p>
            <a href="${githubRepoUrl}" style="color: #2196F3; text-decoration: none;">GitHub 저장소 방문하기</a>
          </div>
          <p style="margin-top: 20px;">감사합니다.</p>
        </div>
      </body>
    </html>
  `;

  const command = new SendEmailCommand({
    Destination: {
      ToAddresses: [message.email],
    },
    Message: {
      Body: {
        Html: {
          Data: htmlBody,
        },
        Text: {
          Data: `새로운 프로젝트가 등록되었습니다. ${message.title} 자세한 내용: ${message.url}\n\n알림 구독 해제: 더 이상 알림을 받지 않으려면 다음 GitHub 저장소에서 귀하의 이슈를 닫아주세요: ${githubRepoUrl}`,
        },
      },
      Subject: {
        Data: `새 프로젝트 알림: ${message.title}`,
      },
    },
    Source: 'project-notification@leemhoon.com',
  });

  await sesClient.send(command);
};

type ReservationMessage = {
  email: string;
  title: string;
  url: string;
  topics?: string[];
};
