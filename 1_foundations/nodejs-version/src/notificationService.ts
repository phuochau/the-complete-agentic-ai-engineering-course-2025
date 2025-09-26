import axios from 'axios';

export class NotificationService {
  private pushoverToken: string;
  private pushoverUser: string;

  constructor() {
    this.pushoverToken = process.env.PUSHOVER_TOKEN || '';
    this.pushoverUser = process.env.PUSHOVER_USER || '';
  }

  async push(text: string): Promise<void> {
    if (!this.pushoverToken || !this.pushoverUser ||
        this.pushoverToken === 'hauvo' || this.pushoverUser === 'hauvo') {
      console.log('📧 Pushover not configured (using placeholder tokens), would send:', text);
      return;
    }

    try {
      await axios.post('https://api.pushover.net/1/messages.json', {
        token: this.pushoverToken,
        user: this.pushoverUser,
        message: text,
      });
      console.log('📧 Pushover notification sent successfully');
    } catch (error: any) {
      console.error('❌ Failed to send pushover notification:', error.response?.data || error.message);
    }
  }
}
