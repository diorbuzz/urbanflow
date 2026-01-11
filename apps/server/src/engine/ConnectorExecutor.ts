import axios from 'axios';
import { connectorRepository } from '../database/repositories/connectorRepository.js';
import { logger } from '../utils/logger.js';

export class ConnectorExecutor {
  async execute(
    connectorId: string,
    action: string,
    inputData: unknown
  ): Promise<unknown> {
    const connector = connectorRepository.findById(connectorId);

    if (!connector) {
      throw new Error(`Connector not found: ${connectorId}`);
    }

    if (!connector.isActive) {
      throw new Error(`Connector is not active: ${connector.name}`);
    }

    logger.debug({ connectorId, action }, 'Executing connector action');

    // 사용 횟수 증가
    connectorRepository.incrementUsageCount(connectorId);

    switch (connector.type) {
      case 'slack':
        return this.executeSlack(connector.config, action, inputData);

      case 'discord':
        return this.executeDiscord(connector.config, action, inputData);

      case 'telegram':
        return this.executeTelegram(connector.config, action, inputData);

      case 'mysql':
      case 'postgresql':
        return this.executeSQL(connector.type, connector.config, action, inputData);

      case 'mongodb':
        return this.executeMongoDB(connector.config, action, inputData);

      case 'custom_api':
        return this.executeCustomAPI(connector.config, action, inputData);

      default:
        throw new Error(`Unsupported connector type: ${connector.type}`);
    }
  }

  // Slack 커넥터
  private async executeSlack(
    config: Record<string, unknown>,
    action: string,
    inputData: unknown
  ): Promise<unknown> {
    const token = config.token as string;
    const data = inputData as Record<string, unknown>;

    switch (action) {
      case 'send_message': {
        const response = await axios.post(
          'https://slack.com/api/chat.postMessage',
          {
            channel: data.channel,
            text: data.text,
            blocks: data.blocks,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.data.ok) {
          throw new Error(`Slack error: ${response.data.error}`);
        }

        return {
          ts: response.data.ts,
          channel: response.data.channel,
        };
      }

      case 'list_channels': {
        const response = await axios.get(
          'https://slack.com/api/conversations.list',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              limit: data.limit || 100,
            },
          }
        );

        if (!response.data.ok) {
          throw new Error(`Slack error: ${response.data.error}`);
        }

        return {
          channels: response.data.channels.map((c: any) => ({
            id: c.id,
            name: c.name,
          })),
        };
      }

      default:
        throw new Error(`Unknown Slack action: ${action}`);
    }
  }

  // Discord 커넥터 (Webhook 사용)
  private async executeDiscord(
    config: Record<string, unknown>,
    action: string,
    inputData: unknown
  ): Promise<unknown> {
    const webhookUrl = config.webhookUrl as string;
    const data = inputData as Record<string, unknown>;

    switch (action) {
      case 'send_message': {
        await axios.post(webhookUrl, {
          content: data.content,
          username: data.username,
          avatar_url: data.avatarUrl,
          embeds: data.embeds,
        });

        return { success: true };
      }

      default:
        throw new Error(`Unknown Discord action: ${action}`);
    }
  }

  // Telegram 커넥터
  private async executeTelegram(
    config: Record<string, unknown>,
    action: string,
    inputData: unknown
  ): Promise<unknown> {
    const botToken = config.botToken as string;
    const chatId = config.chatId as string;
    const data = inputData as Record<string, unknown>;

    switch (action) {
      case 'send_message': {
        const response = await axios.post(
          `https://api.telegram.org/bot${botToken}/sendMessage`,
          {
            chat_id: data.chatId || chatId,
            text: data.text,
            parse_mode: data.parseMode || 'HTML',
          }
        );

        return {
          message_id: response.data.result.message_id,
        };
      }

      default:
        throw new Error(`Unknown Telegram action: ${action}`);
    }
  }

  // SQL 커넥터 (MySQL, PostgreSQL) - 단순화된 버전
  private async executeSQL(
    type: string,
    config: Record<string, unknown>,
    action: string,
    inputData: unknown
  ): Promise<unknown> {
    // 실제 구현에서는 mysql2 또는 pg 라이브러리 사용
    // 여기서는 시뮬레이션
    const data = inputData as Record<string, unknown>;

    logger.info({
      type,
      action,
      sql: data.sql,
    }, 'SQL execution (simulated)');

    // 시뮬레이션 결과
    return {
      rows: [],
      affectedRows: 0,
      message: 'SQL execution simulated. Install mysql2 or pg for real execution.',
    };
  }

  // MongoDB 커넥터 - 단순화된 버전
  private async executeMongoDB(
    config: Record<string, unknown>,
    action: string,
    inputData: unknown
  ): Promise<unknown> {
    const data = inputData as Record<string, unknown>;

    logger.info({
      action,
      collection: data.collection,
    }, 'MongoDB execution (simulated)');

    // 시뮬레이션 결과
    return {
      documents: [],
      message: 'MongoDB execution simulated. Install mongodb for real execution.',
    };
  }

  // Custom API 커넥터
  private async executeCustomAPI(
    config: Record<string, unknown>,
    action: string,
    inputData: unknown
  ): Promise<unknown> {
    const baseUrl = config.baseUrl as string;
    const defaultHeaders = config.headers
      ? JSON.parse(config.headers as string)
      : {};
    const data = inputData as Record<string, unknown>;

    switch (action) {
      case 'request': {
        const method = (data.method as string || 'GET').toLowerCase();
        const path = data.path as string || '';
        const headers = { ...defaultHeaders, ...(data.headers as object || {}) };
        const body = data.body;
        const queryParams = data.queryParams as Record<string, string>;

        const response = await axios({
          method: method as any,
          url: `${baseUrl}${path}`,
          headers,
          data: body,
          params: queryParams,
        });

        return {
          status: response.status,
          headers: response.headers,
          data: response.data,
        };
      }

      default:
        throw new Error(`Unknown Custom API action: ${action}`);
    }
  }
}
