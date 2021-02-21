
const {v4:  uuidv4} = require('uuid');
const AWS = require('aws-sdk');
const fetch = require('node-fetch');

const chime = new AWS.Chime({region: 'us-east-1'});
AWS.config.update({region:'us-east-1'});
const ddb = new AWS.DynamoDB();

const {
  MEETINGS_TABLE_NAME
} = process.env;

export const join = async (event) => {

  console.log(MEETINGS_TABLE_NAME);
  console.log(event);
  const query = event.queryStringParameters;
  if (!query.title || !query.name) {
    throw new Error('Need parameters: title, name');
  }

  // Look up the meeting by its title. If it does not exist, create the meeting.
  let meeting = await getMeeting(query.title);
  const mediaRegion = await getNearestMediaRegion();
  if (!meeting) {
    const requestId = uuidv4();
    const request = {
      MediaRegion: mediaRegion,
      ClientRequestToken: requestId,
      ExternalMeetingId: query.title,
      NotificationsConfiguration: {}
    };
    console.info(`Creating new meeting: ${JSON.stringify(request)}`);
    meeting = await chime.createMeeting(request).promise();
    await putMeeting(query.title, meeting);
  }
  
  console.info(`Adding new attendee`);
  const attendee = await chime.createAttendee({
    MeetingId: meeting.Meeting.MeetingId,
    ExternalUserId: `${uuidv4().substring(0, 8)}#${query.name}`.substring(0, 64)
  }).promise();

  return {
    headers: { 'Content-Type': 'application/json' },
    statusCode: 200,
    body: JSON.stringify({
      JoinInfo: {
        Meeting: meeting,
        Attendee: attendee
      }
    }),
    isBase64Encoded: false
  }
}

export const event_bridge_handler = async (event) => {
  console.log(event);

  if (event.source === 'aws.chime' && event.detail.eventType === 'chime:MeetingEnded') {
    console.info(await deleteMeeting(event.detail.externalMeetingId));
  }
  return {};
}



const getMeeting = async (title) => {
  const result = await ddb.getItem({
    TableName: MEETINGS_TABLE_NAME,
    Key: {
      'Title': {
        S: title
      },
    },
  }).promise();
  return result.Item ? JSON.parse(result.Item.Data.S) : null;
}

const putMeeting = async (title, meeting) => {
  await ddb.putItem({
    TableName: MEETINGS_TABLE_NAME,
    Item: {
      'Title': { S: title },
      'Data': { S: JSON.stringify(meeting) },
      'EndTime': {
        N: `${Math.floor(Date.now() / 1000) + 60 * 60 * 24}` // clean up meeting record one day from now
      }
    }
  }).promise();
}

const deleteMeeting = async (title) => {
  const result = await ddb.deleteItem({
    TableName: MEETINGS_TABLE_NAME,
    Key: {
      'Title': { S: title }
    }
  }).promise();
  return result;
}

const getNearestMediaRegion = async () => {
  var nearestMediaRegion = '';
  const defaultMediaRegion = 'ap-northeast-2';
  try {
    const nearestMediaRegionResponse = await fetch(
      `https://nearest-media-region.l.chime.aws`,
      {
        method: 'GET',
      }
    );
    const nearestMediaRegionJSON = await nearestMediaRegionResponse.json();
    console.log('Nearest media region ' + nearestMediaRegionJSON.region);
    nearestMediaRegion = nearestMediaRegionJSON.region;
  } catch (error) {
    nearestMediaRegion = defaultMediaRegion;
    console.log('Default media region ' + defaultMediaRegion + ' selected: ' + error.message);
  } finally {
    return nearestMediaRegion;
  }
}