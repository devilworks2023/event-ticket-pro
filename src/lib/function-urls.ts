// URLs are injected after edge function deployment.
export const FUNCTION_URLS = {
  stripeCreateCheckoutSession: "https://ympgl1kq--stripe-create-checkout-session.functions.blink.new",
  getOrder: "https://ympgl1kq--get-order.functions.blink.new",
  publicEvents: "https://ympgl1kq--public-events.functions.blink.new",
  publicEventDetails: "https://ympgl1kq--public-event-details.functions.blink.new",
} as const;
