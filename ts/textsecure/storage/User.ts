// Copyright 2021 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import { EventEmitter } from 'events';

import { WebAPICredentials } from '../Types.d';

import { StorageInterface } from '../../types/Storage.d';

import Helpers from '../Helpers';

export type SetCredentialsOptions = {
  uuid?: string;
  number: string;
  deviceId: number;
  deviceName?: string;
  password: string;
};

export class User extends EventEmitter {
  constructor(private readonly storage: StorageInterface) {
    super();
  }

  public async setUuidAndDeviceId(
    uuid: string,
    deviceId: number
  ): Promise<void> {
    await this.storage.put('uuid_id', `${uuid}.${deviceId}`);

    window.log.info('storage.user: uuid and device id changed');
    this.emit('credentialsChange');
  }

  public getNumber(): string | undefined {
    const numberId = this.storage.get('number_id');
    if (numberId === undefined) return undefined;
    return Helpers.unencodeNumber(numberId)[0];
  }

  public getUuid(): string | undefined {
    const uuid = this.storage.get('uuid_id');
    if (uuid === undefined) return undefined;
    return Helpers.unencodeNumber(uuid.toLowerCase())[0];
  }

  public getDeviceId(): number | undefined {
    const value = this._getDeviceIdFromUuid() || this._getDeviceIdFromNumber();
    if (value === undefined) {
      return undefined;
    }
    return parseInt(value, 10);
  }

  public getDeviceName(): string | undefined {
    return this.storage.get('device_name');
  }

  public async setDeviceNameEncrypted(): Promise<void> {
    return this.storage.put('deviceNameEncrypted', true);
  }

  public getDeviceNameEncrypted(): boolean | undefined {
    return this.storage.get('deviceNameEncrypted');
  }

  public async removeSignalingKey(): Promise<void> {
    return this.storage.remove('signaling_key');
  }

  public async setCredentials(
    credentials: SetCredentialsOptions
  ): Promise<void> {
    const { uuid, number, deviceId, deviceName, password } = credentials;

    await Promise.all([
      this.storage.put('number_id', `${number}.${deviceId}`),
      this.storage.put('uuid_id', `${uuid}.${deviceId}`),
      this.storage.put('password', password),
      deviceName
        ? this.storage.put('device_name', deviceName)
        : Promise.resolve(),
    ]);

    window.log.info('storage.user: credentials changed');
    this.emit('credentialsChange');
  }

  public async removeCredentials(): Promise<void> {
    await Promise.all([
      this.storage.remove('number_id'),
      this.storage.remove('uuid_id'),
      this.storage.remove('password'),
      this.storage.remove('device_name'),
    ]);
  }

  public getWebAPICredentials(): WebAPICredentials {
    return {
      username:
        this.storage.get('uuid_id') || this.storage.get('number_id') || '',
      password: this.storage.get('password', ''),
    };
  }

  private _getDeviceIdFromUuid(): string | undefined {
    const uuid = this.storage.get('uuid_id');
    if (uuid === undefined) return undefined;
    return Helpers.unencodeNumber(uuid)[1];
  }

  private _getDeviceIdFromNumber(): string | undefined {
    const numberId = this.storage.get('number_id');
    if (numberId === undefined) return undefined;
    return Helpers.unencodeNumber(numberId)[1];
  }

  //
  // EventEmitter typing
  //

  public on(type: 'credentialsChange', callback: () => void): this;

  public on(
    type: string | symbol,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listener: (...args: Array<any>) => void
  ): this {
    return super.on(type, listener);
  }

  public emit(type: 'credentialsChange'): boolean;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public emit(type: string | symbol, ...args: Array<any>): boolean {
    return super.emit(type, ...args);
  }
}