"use client";

import React, { useEffect, useRef } from "react";

export function WebGLShaderCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) return;

    // Vertex Shader
    const vsSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Fragment Shader - fluid vibrant gradient with noise
    const fsSource = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec2 u_mouse;

      // Modulo-less GLSL 2D simplex noise by Ian McEwan, Ashima Arts
      vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
      float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                 -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
          dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 a0 = x - floor(x + 0.5);
        vec3 g = sin(u_time * 0.1) * a0 + cos(u_time * 0.15) * h;
        vec3 oct = m * g;
        return 130.0 * dot(oct, vec3(1.0));
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        
        // Center uv and adjust aspect ratio
        vec2 p = uv - 0.5;
        p.x *= u_resolution.x / u_resolution.y;

        // Interactive mouse distortion
        vec2 m = u_mouse / u_resolution.xy - 0.5;
        m.x *= u_resolution.x / u_resolution.y;

        // Fluid noise coordinates
        float noise1 = snoise(p * 1.6 + u_time * 0.12 + m * 0.6);
        float noise2 = snoise(p * 2.2 - u_time * 0.08 - m * 0.4);

        // Color definitions matching the dark theme & accent
        vec3 spaceColor = vec3(0.05, 0.06, 0.07); // Base dark background
        vec3 accentBlue = vec3(0.37, 0.42, 0.82); // HypeMind accent blue (#5E6AD2)
        vec3 accentPurple = vec3(0.58, 0.32, 0.88); // Pulsing Purple (#9F7AEA)
        vec3 accentCyan = vec3(0.18, 0.62, 0.86);

        // Calculate mixing weights based on noise and coordinates
        float w1 = smoothstep(-0.4, 0.7, noise1 + length(p - m * 0.25) * 0.3);
        float w2 = smoothstep(-0.5, 0.6, noise2 - length(p + m * 0.15) * 0.4);

        // Compose final color
        vec3 col = mix(spaceColor, accentBlue, w1);
        col = mix(col, accentPurple, w2 * 0.65);
        col = mix(col, accentCyan, (noise1 * noise2) * 0.3);

        // Add central glow aura
        float glow = 0.08 / (length(p - m * 0.1) + 0.18);
        col += accentBlue * glow * 0.4;

        // Apply edge vignette
        float vignette = uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
        vignette = clamp(pow(16.0 * vignette, 0.5), 0.0, 1.0);
        col *= vignette;

        gl_FragColor = vec4(col, 0.75);
      }
    `;

    // Helper functions to compile and run shaders
    const createShader = (glContext: WebGLRenderingContext, shaderType: number, source: string) => {
      const shader = glContext.createShader(shaderType);
      if (!shader) return null;
      glContext.shaderSource(shader, source);
      glContext.compileShader(shader);
      if (!glContext.getShaderParameter(shader, glContext.COMPILE_STATUS)) {
        console.error(glContext.getShaderInfoLog(shader));
        glContext.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Fullscreen quad geometry
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]), gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const resLoc = gl.getUniformLocation(program, "u_resolution");
    const timeLoc = gl.getUniformLocation(program, "u_time");
    const mouseLoc = gl.getUniformLocation(program, "u_mouse");

    // Track mouse moves relative to window
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.targetX = e.clientX - rect.left;
      mouseRef.current.targetY = rect.height - (e.clientY - rect.top); // Flip Y coordinate
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Resize canvas display
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = Math.floor(canvas.clientWidth * dpr);
      const displayHeight = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
    };
    resize();
    window.addEventListener("resize", resize);

    // WebGL Loop
    let animFrame: number;
    const render = (time: number) => {
      resize();

      // Lerp mouse target for smooth movements
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      gl.uniform2f(resLoc, canvas.width, canvas.height);
      gl.uniform1f(timeLoc, time * 0.001);
      gl.uniform2f(mouseLoc, mouse.x, mouse.y);

      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animFrame = requestAnimationFrame(render);
    };
    animFrame = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animFrame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: "-15%",
        left: "-15%",
        width: "130%",
        height: "130%",
        zIndex: 0,
        pointerEvents: "none",
        mixBlendMode: "screen",
        opacity: 0.65,
        filter: "blur(40px)",
      }}
    />
  );
}
