import { Instance as IInstance } from 'ararat-ui-web/types/instance';

export default class Instance implements IInstance {
  name: string;
  constructor(name: string) {
    this.name = name;
  }

  async openConsoleSocket(
    type: 'vga' | 'console' = 'console',
    options?: { width?: number; height?: number },
  ) {
    const response = await fetch(
      `/1.0/instances/${encodeURIComponent(this.name)}/console`,
      {
        method: 'POST',
        body: JSON.stringify({
          type: type,
          'wait-for-websocket': true,
          force: true,
          width: options?.width,
          height: options?.height,
        }),
      },
    );
    const data = await response.json();
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return {
      data: new WebSocket(
        `${protocol}://${window.location.host}${data.operation}/websocket?secret=${data.metadata.metadata.fds['0']}`,
      ),
      control: new WebSocket(
        `${protocol}://${window.location.host}${data.operation}/websocket?secret=${data.metadata.metadata.fds['control']}`,
      ),
    };
  }

  async getConsoleOutput() {
    const response = await fetch(
      `/1.0/instances/${encodeURIComponent(this.name)}/console`,
    );
    return await response.text();
  }
}
