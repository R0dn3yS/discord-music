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

  clear(): void {
    this.queue = [];
  }
}