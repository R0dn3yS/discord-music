import { VoiceBasedChannel } from 'npm:discord.js@14.25.1';
import { Track } from './track.ts';
import { Player } from './player.ts';

export class Queue {
  private queue: Track[];

  constructor() {
    this.queue = [];
  }

  async add(url: string): Promise<boolean|Track> {
    if (url.match(/^(?:https?:)?(?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch|v|embed)(?:\.php)?(?:\?.*v=|\/))([a-zA-Z0-9\_-]{7,15})(?:[\?&][a-zA-Z0-9\_-]+=[a-zA-Z0-9\_-]+)*(?:[&\/\#].*)?$/gm) === null || url.includes('"')) return false;

    const track = new Track(url);
    if (!(await track.init())) return false;

    this.queue.push(track);
    return track;
  }

  async addPlaylist(url: string, player: Player, channel: VoiceBasedChannel): Promise<boolean|string> {
    if (url.includes('&list') && url.match(/^(?:https?:)?(?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch|v|embed)(?:\.php)?(?:\?.*v=|\/))([a-zA-Z0-9\_-]{7,15})(?:[\?&][a-zA-Z0-9\_-]+=[a-zA-Z0-9\_-]+)*(?:[&\/\#].*)?$/gm) === null || url.includes('"')) return false;

    const list = await this.parsePlaylist(url);

    player.joinVoice(channel);

    for (const url of list) {
      const track = new Track(url);
      if (!(await track.init())) continue;

      this.queue.push(track);

      player.playNext();
    }

    return await this.getPlaylistName(url);
  }

  get(): Track[] {
    return this.queue;
  }

  shift(): Track|undefined {
    return this.queue.shift();
  }

  move(from: string, to: string): void {
    const f = parseInt(from);
    let t = parseInt(to);

    if (this.queue.length < f) throw new Error('No song in From position.');
    if (this.queue.length < t) t = this.queue.length;

    const track = this.queue[f];
    this.queue.splice(f, 1);
    this.queue.splice(t, 0, track);
    return;
  }

  async addToFirst(url: string): Promise<boolean|Track> {
    if (url.match(/^(?:https?:)?(?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch|v|embed)(?:\.php)?(?:\?.*v=|\/))([a-zA-Z0-9\_-]{7,15})(?:[\?&][a-zA-Z0-9\_-]+=[a-zA-Z0-9\_-]+)*(?:[&\/\#].*)?$/gm) === null || url.includes('"')) return false;

    const track = new Track(url);
    if (!(await track.init())) return false

    this.queue.splice(1, 0, track);
    return track;
  }

  clear(): void {
    this.queue = [];
  }

  async parsePlaylist(url: string): Promise<string[]> {
    const output: string[] = [];

    const getInfo = new Deno.Command('/usr/bin/yt-dlp', {
      args: `--dump-json ${url} --remote-components ejs:github --no-warning`.split(' '),
      stdin: 'null',
      stdout: 'piped',
    });

    const child = getInfo.spawn();
    const { stdout } = await child.output();

    const playlist = new TextDecoder().decode(stdout);

    Deno.writeTextFileSync('dump.txt', playlist);

    for (const line of Deno.readTextFileSync('dump.txt').trim().split('\n')) {
      console.log(line);

      const json = JSON.parse(line);

      output.push(`https://youtube.com/watch?v=${json.id}`);
    }

    console.log(output);

    return output;
  }

  async getPlaylistName(url: string): Promise<string> {
    const getInfo = new Deno.Command('/usr/bin/yt-dlp', {
      args: `${url} -I 1:1 --remote-components ejs:github --skip-download --no-warning --print playlist_title`.split(' '),
      stdin: 'null',
      stdout: 'piped',
    });

    const child = getInfo.spawn();
    const { stdout } = await child.output();

    return new TextDecoder().decode(stdout).trim();
  }

  shuffle(): boolean {
    if (this.queue.length === 0 || this.queue.length === 1) return false;

    const sQueue = this.queue;

    const firstTrack = sQueue.shift();

    for (let i = sQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sQueue[i], sQueue[j]] = [sQueue[j], sQueue[i]];
    }

    sQueue.splice(0, 0, firstTrack!);

    this.queue = sQueue;

    return true;
  }
}