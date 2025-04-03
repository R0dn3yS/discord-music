import { Client, VoiceBasedChannel } from 'npm:discord.js';
import { AudioPlayer, createAudioPlayer, createAudioResource, joinVoiceChannel, NoSubscriberBehavior, VoiceConnection } from 'npm:@discordjs/voice';
import { Queue } from "./queue.ts";
import { Track } from './track.ts';

export class Player {
  public client: Client;
  public queue: Queue;
  public audioPlayer: AudioPlayer;
  public connection?: VoiceConnection;
  public dcOnTimeout: boolean;

  constructor(client: Client) {
    this.client = client;
    this.queue = new Queue();
    this.dcOnTimeout = true;

    this.audioPlayer = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
    });
  }

  joinVoice(channel: VoiceBasedChannel): void {
    if (!channel) return;

    this.connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });

    this.connection.subscribe(this.audioPlayer);
  }

  disconnectVoice(): void {
    this.connection?.destroy();
    this.queue.clear();
    Deno.removeSync('.musicCache', { recursive: true });
  }

  playNext(): void {
    this.dcOnTimeout = false;
    if (this.audioPlayer.state.status === 'idle') {
      const resource = createAudioResource(this.queue.get()[0].getFile() ?? '');
      this.audioPlayer.play(resource);
    }
  }

  nextInQueue(): void {
    this.dcOnTimeout = false;
    const old = this.queue.shift();
    let isInQueue = false;

    for (const track of this.queue.get()) {
      if (track.getId() === old?.getId()) isInQueue = true;
    }

    if (old?.getFile() && !isInQueue) Deno.removeSync(old.getFile());

    const resource = createAudioResource(this.queue.get()[0].getFile() ?? '');
    this.audioPlayer.play(resource);
  }

  pause(): void {
    this.audioPlayer.state.status === 'playing' ? this.audioPlayer.pause() : this.audioPlayer.unpause();
  }

  async search(query: string): Promise<boolean | Track> {
    const getInfo = new Deno.Command('/usr/bin/yt-dlp', {
      args: [ '--default-search','ytsearch', `"${query}"`, '--dump-json' ],
      stdin: 'null',
      stdout: 'piped',
    });

    const child = getInfo.spawn();
    const { stdout } = await child.output();

    const data = JSON.parse(new TextDecoder().decode(stdout));

    return await this.queue.add(`https://youtube.com/watch?v=${data.id}`);
  }
}