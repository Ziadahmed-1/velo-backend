export class BostaWebhookPayload {
  type: string;
  data: {
    _id: string;
    trackingNumber: string;
    status: string;
    [key: string]: any;
  };
}

export class MylerzWebhookPayload {
  awb: string;
  status: string;
  [key: string]: any;
}
