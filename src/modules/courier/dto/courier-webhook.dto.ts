/** Bosta webhook payload */
export class BostaWebhookPayload {
  /** Webhook event type */
  type: string;
  /** Webhook event data */
  data: {
    /** Tracking record ID */
    _id: string;
    /** Order tracking number */
    trackingNumber: string;
    /** Delivery status */
    status: string;
    [key: string]: any;
  };
}

/** Mylerz webhook payload */
export class MylerzWebhookPayload {
  /** Air waybill / tracking number */
  awb: string;
  /** Delivery status */
  status: string;
  [key: string]: any;
}
