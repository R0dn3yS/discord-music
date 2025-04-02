import { Client, VoiceBasedChannel } from 'npm:discord.js';
import { AudioPlayer, createAudioPlayer, createAudioResource, joinVoiceChannel, NoSubscriberBehavior, VoiceConnection } from 'npm:@discordjs/voice';
import { Queue } from "./queue.ts";

export class Player {
  public client: Client;
  public queue: Queue;
  public audioPlayer: AudioPlayer;
  public connection?: VoiceConnection;

  constructor(client: Client) {
    this.client = client;
    this.queue = new Queue();
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
    this.connection?.disconnect();
    this.queue.clear();
    Deno.removeSync('.musicCache', { recursive: true });

  }

  playNext(): void {
    if (this.audioPlayer.state.status === 'idle') {
      const resource = createAudioResource(this.queue.get()[0].getFile() ?? '');
      this.audioPlayer.play(resource);
    }
  }

  nextInQueue(): void {
    const old = this.queue.shift();

    if (old?.getFile()) Deno.removeSync(old.getFile());

    const resource = createAudioResource(this.queue.get()[0].getFile() ?? '');
    this.audioPlayer.play(resource);
  }

  pause(): void {
    this.audioPlayer.state.status === 'playing' ? this.audioPlayer.pause() : this.audioPlayer.unpause();
  }
}