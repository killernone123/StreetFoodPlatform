declare module "react-native-razorpay" {
  interface RazorpayOptions {
    description?: string;
    image?: string;
    currency?: string;
    key: string;
    amount: number;
    name: string;
    order_id?: string;

    prefill?: {
      name?: string;
      email?: string;
      contact?: string;
    };

    notes?: {
      [key: string]: string;
    };

    theme?: {
      color?: string;
    };
  }

  interface RazorpayResult {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }

  const RazorpayCheckout: {
    open(
      options: RazorpayOptions
    ): Promise<RazorpayResult>;
  };

  export default RazorpayCheckout;
}