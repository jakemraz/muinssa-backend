import {
  ConsoleLogger,
  DefaultDeviceController,
  DefaultMeetingSession,
  LogLevel,
  MeetingSessionConfiguration,
} from 'amazon-chime-sdk-js';

export const join = async (event: JSON) => {
  const logger = new ConsoleLogger('ChimeMeetingLogs', LogLevel.INFO);
  console.log('hihi');
  return {
    statusCode: 200,
    body: `good`,
  }
}