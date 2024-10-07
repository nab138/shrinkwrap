/*
    This code is adapted from https://github.com/pmndrs/drei

    This license is for the original code in the file OrbitControls.tsx
        
    MIT License

    Copyright (c) 2020 react-spring

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
*/

import { OrbitControlsProps } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as React from "react";
import { Event } from "three";

const OrbitControls = React.forwardRef<OrbitControlsImpl, OrbitControlsProps>(
  (
    {
      makeDefault,
      camera,
      regress,
      domElement,
      enableDamping = true,
      keyEvents = false,
      onChange,
      onStart,
      onEnd,
      ...restProps
    },
    ref
  ) => {
    const invalidate = useThree((state) => state.invalidate);
    const defaultCamera = useThree((state) => state.camera);
    const gl = useThree((state) => state.gl);
    const events = useThree((state) => state.events);
    const setEvents = useThree((state) => state.setEvents);
    const set = useThree((state) => state.set);
    const get = useThree((state) => state.get);
    const performance = useThree((state) => state.performance);
    const explCamera = camera || defaultCamera;
    const explDomElement = domElement || events.connected || gl.domElement;
    const controls = React.useMemo(
      () => new OrbitControlsImpl(explCamera as any),
      [explCamera]
    );
    useFrame(() => {
      if (controls.enabled) controls.update();
    }, -1);
    React.useEffect(() => {
      if (keyEvents) {
        controls.connect(keyEvents === true ? explDomElement : keyEvents);
      }
      controls.connect(explDomElement);
      return () => void controls.dispose();
    }, [keyEvents, explDomElement, regress, controls, invalidate]);
    React.useEffect(() => {
      const callback = (e: any) => {
        invalidate();
        if (regress) performance.regress();
        if (onChange) onChange(e);
      };
      const onStartCb = (e: Event<string, unknown> | undefined) => {
        if (onStart) onStart(e);
      };
      const onEndCb = (e: Event<string, unknown> | undefined) => {
        if (onEnd) onEnd(e);
      };
      controls.addEventListener("change", callback);
      controls.addEventListener("start", onStartCb);
      controls.addEventListener("end", onEndCb);
      return () => {
        controls.removeEventListener("start", onStartCb);
        controls.removeEventListener("end", onEndCb);
        controls.removeEventListener("change", callback);
      };
    }, [onChange, onStart, onEnd, controls, invalidate, setEvents]);
    React.useEffect(() => {
      if (makeDefault) {
        const old = get().controls;
        set({
          controls,
        });
        return () =>
          set({
            controls: old,
          });
      }
    }, [makeDefault, controls]);
    return (
      <primitive
        ref={ref}
        object={controls}
        enableDamping={enableDamping}
        {...restProps}
      />
    );
  }
);

export default OrbitControls;
