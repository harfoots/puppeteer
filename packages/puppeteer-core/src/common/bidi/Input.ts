/**
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {Point} from '../../api/ElementHandle.js';
import {
  Keyboard as BaseKeyboard,
  Mouse as BaseMouse,
  Touchscreen as BaseTouchscreen,
  KeyDownOptions,
  KeyPressOptions,
  KeyboardTypeOptions,
  MouseButton,
  MouseClickOptions,
  MouseMoveOptions,
  MouseOptions,
  MouseWheelOptions,
} from '../../api/Input.js';
import {KeyInput} from '../USKeyboardLayout.js';

import {BrowsingContext} from './BrowsingContext.js';

const enum InputId {
  Mouse = '__puppeteer_mouse',
  Keyboard = '__puppeteer_keyboard',
  Wheel = '__puppeteer_wheel',
  Finger = '__puppeteer_finger',
}

const getBidiKeyValue = (key: string) => {
  switch (key) {
    case '\n':
      key = 'Enter';
      break;
  }
  // Measures the number of code points rather than UTF-16 code units.
  if ([...key].length === 1) {
    return key;
  }
  switch (key) {
    case 'Unidentified':
      return '\uE000';
    case 'Cancel':
      return '\uE001';
    case 'Help':
      return '\uE002';
    case 'Backspace':
      return '\uE003';
    case 'Tab':
      return '\uE004';
    case 'Clear':
      return '\uE005';
    case 'Return':
      return '\uE006';
    case 'Enter':
      return '\uE007';
    case 'Shift':
      return '\uE008';
    case 'Control':
      return '\uE009';
    case 'Alt':
      return '\uE00A';
    case 'Pause':
      return '\uE00B';
    case 'Escape':
      return '\uE00C';
    case ' ':
      return '\uE00D';
    case 'PageUp':
      return '\uE00E';
    case 'PageDown':
      return '\uE00F';
    case 'End':
      return '\uE010';
    case 'Home':
      return '\uE011';
    case 'ArrowLeft':
      return '\uE012';
    case 'ArrowUp':
      return '\uE013';
    case 'ArrowRight':
      return '\uE014';
    case 'ArrowDown':
      return '\uE015';
    case 'Insert':
      return '\uE016';
    case 'Delete':
      return '\uE017';
    case ';':
      return '\uE018';
    case '=':
      return '\uE019';
    case '0':
      return '\uE01A';
    case '1':
      return '\uE01B';
    case '2':
      return '\uE01C';
    case '3':
      return '\uE01D';
    case '4':
      return '\uE01E';
    case '5':
      return '\uE01F';
    case '6':
      return '\uE020';
    case '7':
      return '\uE021';
    case '8':
      return '\uE022';
    case '9':
      return '\uE023';
    case '*':
      return '\uE024';
    case '+':
      return '\uE025';
    case ',':
      return '\uE026';
    case '-':
      return '\uE027';
    case '.':
      return '\uE028';
    case '/':
      return '\uE029';
    case 'F1':
      return '\uE031';
    case 'F2':
      return '\uE032';
    case 'F3':
      return '\uE033';
    case 'F4':
      return '\uE034';
    case 'F5':
      return '\uE035';
    case 'F6':
      return '\uE036';
    case 'F7':
      return '\uE037';
    case 'F8':
      return '\uE038';
    case 'F9':
      return '\uE039';
    case 'F10':
      return '\uE03A';
    case 'F11':
      return '\uE03B';
    case 'F12':
      return '\uE03C';
    case 'Meta':
      return '\uE03D';
    case 'ZenkakuHankaku':
      return '\uE040';
    default:
      throw new Error(`Unknown key: "${key}"`);
  }
};

/**
 * @internal
 */
export class Keyboard extends BaseKeyboard {
  #context: BrowsingContext;

  /**
   * @internal
   */
  constructor(context: BrowsingContext) {
    super();
    this.#context = context;
  }

  override async down(
    key: KeyInput,
    options?: Readonly<KeyDownOptions>
  ): Promise<void> {
    if (options) {
      throw new Error('KeyDownOptions are not supported');
    }
    await this.#context.connection.send('input.performActions', {
      context: this.#context.id,
      actions: [
        {
          type: Bidi.Input.SourceActionsType.Key,
          id: InputId.Keyboard,
          actions: [
            {
              type: Bidi.Input.ActionType.KeyDown,
              value: getBidiKeyValue(key),
            },
          ],
        },
      ],
    });
  }

  override async up(key: KeyInput): Promise<void> {
    await this.#context.connection.send('input.performActions', {
      context: this.#context.id,
      actions: [
        {
          type: Bidi.Input.SourceActionsType.Key,
          id: InputId.Keyboard,
          actions: [
            {
              type: Bidi.Input.ActionType.KeyUp,
              value: getBidiKeyValue(key),
            },
          ],
        },
      ],
    });
  }

  override async press(
    key: KeyInput,
    options: Readonly<KeyPressOptions> = {}
  ): Promise<void> {
    const {delay = 0} = options;
    const actions: Bidi.Input.KeySourceAction[] = [
      {
        type: Bidi.Input.ActionType.KeyDown,
        value: getBidiKeyValue(key),
      },
    ];
    if (delay > 0) {
      actions.push({
        type: Bidi.Input.ActionType.Pause,
        duration: delay,
      });
    }
    actions.push({
      type: Bidi.Input.ActionType.KeyUp,
      value: getBidiKeyValue(key),
    });
    await this.#context.connection.send('input.performActions', {
      context: this.#context.id,
      actions: [
        {
          type: Bidi.Input.SourceActionsType.Key,
          id: InputId.Keyboard,
          actions,
        },
      ],
    });
  }

  override async type(
    text: string,
    options: Readonly<KeyboardTypeOptions> = {}
  ): Promise<void> {
    const {delay = 0} = options;
    // This spread separates the characters into code points rather than UTF-16
    // code units.
    const values = [...text].map(getBidiKeyValue);
    const actions: Bidi.Input.KeySourceAction[] = [];
    if (delay <= 0) {
      for (const value of values) {
        actions.push(
          {
            type: Bidi.Input.ActionType.KeyDown,
            value,
          },
          {
            type: Bidi.Input.ActionType.KeyUp,
            value,
          }
        );
      }
    } else {
      for (const value of values) {
        actions.push(
          {
            type: Bidi.Input.ActionType.KeyDown,
            value,
          },
          {
            type: Bidi.Input.ActionType.Pause,
            duration: delay,
          },
          {
            type: Bidi.Input.ActionType.KeyUp,
            value,
          }
        );
      }
    }
    await this.#context.connection.send('input.performActions', {
      context: this.#context.id,
      actions: [
        {
          type: Bidi.Input.SourceActionsType.Key,
          id: InputId.Keyboard,
          actions,
        },
      ],
    });
  }
}

/**
 * @internal
 */
interface BidiMouseClickOptions extends MouseClickOptions {
  origin?: Bidi.Input.Origin;
}

/**
 * @internal
 */
interface BidiMouseMoveOptions extends MouseMoveOptions {
  origin?: Bidi.Input.Origin;
}

/**
 * @internal
 */
interface BidiTouchMoveOptions {
  origin?: Bidi.Input.Origin;
}

const getBidiButton = (button: MouseButton) => {
  switch (button) {
    case MouseButton.Left:
      return 0;
    case MouseButton.Middle:
      return 1;
    case MouseButton.Right:
      return 2;
    case MouseButton.Back:
      return 3;
    case MouseButton.Forward:
      return 4;
  }
};

/**
 * @internal
 */
export class Mouse extends BaseMouse {
  #context: BrowsingContext;
  #lastMovePoint?: Point;

  /**
   * @internal
   */
  constructor(context: BrowsingContext) {
    super();
    this.#context = context;
  }

  override async reset(): Promise<void> {
    this.#lastMovePoint = undefined;
    await this.#context.connection.send('input.releaseActions', {
      context: this.#context.id,
    });
  }

  override async move(
    x: number,
    y: number,
    options: Readonly<BidiMouseMoveOptions> = {}
  ): Promise<void> {
    this.#lastMovePoint = {
      x,
      y,
    };
    await this.#context.connection.send('input.performActions', {
      context: this.#context.id,
      actions: [
        {
          type: Bidi.Input.SourceActionsType.Pointer,
          id: InputId.Mouse,
          actions: [
            {
              type: Bidi.Input.ActionType.PointerMove,
              x,
              y,
              duration: (options.steps ?? 0) * 50,
              origin: options.origin,
            },
          ],
        },
      ],
    });
  }

  override async down(options: Readonly<MouseOptions> = {}): Promise<void> {
    await this.#context.connection.send('input.performActions', {
      context: this.#context.id,
      actions: [
        {
          type: Bidi.Input.SourceActionsType.Pointer,
          id: InputId.Mouse,
          actions: [
            {
              type: Bidi.Input.ActionType.PointerDown,
              button: getBidiButton(options.button ?? MouseButton.Left),
            },
          ],
        },
      ],
    });
  }

  override async up(options: Readonly<MouseOptions> = {}): Promise<void> {
    await this.#context.connection.send('input.performActions', {
      context: this.#context.id,
      actions: [
        {
          type: Bidi.Input.SourceActionsType.Pointer,
          id: InputId.Mouse,
          actions: [
            {
              type: Bidi.Input.ActionType.PointerUp,
              button: getBidiButton(options.button ?? MouseButton.Left),
            },
          ],
        },
      ],
    });
  }

  override async click(
    x: number,
    y: number,
    options: Readonly<BidiMouseClickOptions> = {}
  ): Promise<void> {
    const actions: Bidi.Input.PointerSourceAction[] = [
      {
        type: Bidi.Input.ActionType.PointerMove,
        x,
        y,
        origin: options.origin,
      },
    ];
    const pointerDownAction = {
      type: Bidi.Input.ActionType.PointerDown,
      button: getBidiButton(options.button ?? MouseButton.Left),
    } as const;
    const pointerUpAction = {
      type: Bidi.Input.ActionType.PointerUp,
      button: pointerDownAction.button,
    } as const;
    for (let i = 1; i < (options.count ?? 1); ++i) {
      actions.push(pointerDownAction, pointerUpAction);
    }
    actions.push(pointerDownAction);
    if (options.delay) {
      actions.push({
        type: Bidi.Input.ActionType.Pause,
        duration: options.delay,
      });
    }
    actions.push(pointerUpAction);
    await this.#context.connection.send('input.performActions', {
      context: this.#context.id,
      actions: [
        {
          type: Bidi.Input.SourceActionsType.Pointer,
          id: InputId.Mouse,
          actions,
        },
      ],
    });
  }

  override async wheel(
    options: Readonly<MouseWheelOptions> = {}
  ): Promise<void> {
    await this.#context.connection.send('input.performActions', {
      context: this.#context.id,
      actions: [
        {
          type: Bidi.Input.SourceActionsType.Wheel,
          id: InputId.Wheel,
          actions: [
            {
              type: Bidi.Input.ActionType.Scroll,
              ...(this.#lastMovePoint ?? {
                x: 0,
                y: 0,
              }),
              deltaX: options.deltaX ?? 0,
              deltaY: options.deltaY ?? 0,
            },
          ],
        },
      ],
    });
  }
}

/**
 * @internal
 */
export class Touchscreen extends BaseTouchscreen {
  #context: BrowsingContext;

  /**
   * @internal
   */
  constructor(context: BrowsingContext) {
    super();
    this.#context = context;
  }

  override async tap(
    x: number,
    y: number,
    options: BidiTouchMoveOptions = {}
  ): Promise<void> {
    await this.touchStart(x, y, options);
    await this.touchEnd();
  }

  override async touchStart(
    x: number,
    y: number,
    options: BidiTouchMoveOptions = {}
  ): Promise<void> {
    await this.#context.connection.send('input.performActions', {
      context: this.#context.id,
      actions: [
        {
          type: Bidi.Input.SourceActionsType.Pointer,
          id: InputId.Finger,
          parameters: {
            pointerType: Bidi.Input.PointerType.Touch,
          },
          actions: [
            {
              type: Bidi.Input.ActionType.PointerMove,
              x,
              y,
              origin: options.origin,
            },
            {
              type: Bidi.Input.ActionType.PointerDown,
              button: 0,
            },
          ],
        },
      ],
    });
  }

  override async touchMove(
    x: number,
    y: number,
    options: BidiTouchMoveOptions = {}
  ): Promise<void> {
    await this.#context.connection.send('input.performActions', {
      context: this.#context.id,
      actions: [
        {
          type: Bidi.Input.SourceActionsType.Pointer,
          id: InputId.Finger,
          parameters: {
            pointerType: Bidi.Input.PointerType.Touch,
          },
          actions: [
            {
              type: Bidi.Input.ActionType.PointerMove,
              x,
              y,
              origin: options.origin,
            },
          ],
        },
      ],
    });
  }

  override async touchEnd(): Promise<void> {
    await this.#context.connection.send('input.performActions', {
      context: this.#context.id,
      actions: [
        {
          type: Bidi.Input.SourceActionsType.Pointer,
          id: InputId.Finger,
          parameters: {
            pointerType: Bidi.Input.PointerType.Touch,
          },
          actions: [
            {
              type: Bidi.Input.ActionType.PointerUp,
              button: 0,
            },
          ],
        },
      ],
    });
  }
}
