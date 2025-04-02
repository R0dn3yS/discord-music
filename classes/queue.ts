import { Track } from "./track.ts";

export class Queue {
  private queue: Track[];

  constructor() {
    this.queue = [];
  }

  async add(url: string): Promise<boolean | Track> {
    if (url.match(/^(?:https?:)?(?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch|v|embed)(?:\.php)?(?:\?.*v=|\/))([a-zA-Z0-9\_-]{7,15})(?:[\?&][a-zA-Z0-9\_-]+=[a-zA-Z0-9\_-]+)*(?:[&\/\#].*)?$/gm) === null || url.includes('"')) return false;

    const track = new Track(url);
    if (!(await track.init())) return false

    this.queue.push(track);
    return track;
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

  async addToFirst(url: string): Promise<boolean | Track> {
    if (url.match(/^(?:https?:)?(?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch|v|embed)(?:\.php)?(?:\?.*v=|\/))([a-zA-Z0-9\_-]{7,15})(?:[\?&][a-zA-Z0-9\_-]+=[a-zA-Z0-9\_-]+)*(?:[&\/\#].*)?$/gm) === null || url.includes('"')) return false;

    const track = new Track(url);
    if (!(await track.init())) return false

    this.queue.splice(1, 0, track);
    return track;
  }

  clear(): void {
    this.queue = [];
  }
}