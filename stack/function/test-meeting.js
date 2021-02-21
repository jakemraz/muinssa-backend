const meeting = require('./meeting');

const meeting_payload = {
  queryStringParameters: {
    title: '반갑습니다',
    name: 'jake'
  }
}

//meeting.join(meeting_payload).then(res => console.log(res)).catch(err => console.log(err));

const event_bridge_payload = {
  version: '0',
  id: 'testid',
  'detail-type': 'Chime Meeting State Change',
  source: 'aws.chime',
  account: 'testaccount',
  time: '2021-02-19T13:14:44Z',
  region: 'us-east-1',
  resources: [
    
  ],
  detail: {
    version: '0',
    eventType: 'chime:MeetingEnded',
    timestamp: 1613927761740,
    meetingId: '68b9724c-9026-4f4d-bebf-c108a61f0d11',
    externalMeetingId: 'test'
  }
}

meeting.event_bridge_handler(event_bridge_payload);


