// Blends the two textures based on alpha value of the foreground texture

precision mediump float;

varying vec2 vTexCoord;
uniform sampler2D uBgTex;
uniform sampler2D uFgTex;

void main() {
    vec4 bgCol = texture2D(uBgTex, vTexCoord);
    vec4 fgCol = texture2D(uFgTex, vTexCoord);
    vec3 finalRgb = mix(bgCol.rgb, fgCol.rgb + bgCol.rgb, float(fgCol.a > 0.));
    // finalRgb = mix(finalRgb, fgCol.rgb, 0.1 * float(fgCol.a == 1. && length(fgCol.rgb) < 0.1));
    // finalRgb = mix(finalRgb, fgCol.rgb, float(fgCol.a == 1.));
    float colorDiff = length(finalRgb - bgCol.rgb) * fgCol.a;
    finalRgb = mix(finalRgb, fgCol.rgb, fgCol.a * length(fgCol.rgb));
    
    gl_FragColor = vec4(finalRgb, 1.0); 
}