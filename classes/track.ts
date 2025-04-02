import { exists } from 'jsr:@std/fs/exists';

export class Track {
  private url: string;
  private id?: string;
  private title?: string;
  private path?: string;

  constructor(url: string) {
    this.url = url;
  }

  async init(): Promise<boolean> {
    const mediaInfo = await this.getMediaInfo();

    this.title = mediaInfo.title;
    this.id = mediaInfo.id;
    this.path = `.musicCache/${this.id}.mp3`;

    return await this.downloadFile();
  }

  async getMediaInfo(): Promise<Record<string, string>> {
    const getInfo = new Deno.Command('/usr/bin/yt-dlp', {
      args: `--dump-json ${this.url}`.split(' '),
      stdin: 'null',
      stdout: 'piped',
    });

    const child = getInfo.spawn();
    const { stdout } = await child.output();

    return JSON.parse(new TextDecoder().decode(stdout));
  }

  async downloadFile(): Promise<boolean> {
    if (!exists('dl')) Deno.mkdirSync('dl');

    const dlCmd = new Deno.Command('/usr/bin/yt-dlp', {
      args: `-x --audio-format mp3 -o ${this.path} ${this.url}`.split(' '),
      stdin: 'null',
      stdout: 'null',
    });

    const child = dlCmd.spawn();
    const status = await child.status;

    return status.code === 0;
  }

  getTitle(): string {
    return this.title ?? '';
  }

  getFile(): string {
    return this.path ?? '';
  }

  getId(): string {
    return this.id ?? '';
  }
}
