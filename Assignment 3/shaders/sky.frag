precision mediump float;

varying vec2 vTexCoord;
uniform vec4 uColor0;
uniform vec4 uColor1;
uniform vec4 uColor2;
uniform vec4 uColor3;
uniform float uTime;
uniform float uWindowWidth;

#define PI 3.1415926535897932384626433832795

// Gotten from: https://stackoverflow.com/questions/12964279/whats-the-origin-of-this-glsl-rand-one-liner
// And
// https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
float rand(vec2 c){
	return fract(sin(dot(c.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

float noise(vec2 p, float freq ){
	float unit = uWindowWidth/freq;
	vec2 ij = floor(p/unit);
	vec2 xy = mod(p,unit)/unit;
	//xy = 3.*xy*xy-2.*xy*xy*xy;
	xy = .5*(1.-cos(PI*xy));
	float a = rand((ij+vec2(0.,0.)));
	float b = rand((ij+vec2(1.,0.)));
	float c = rand((ij+vec2(0.,1.)));
	float d = rand((ij+vec2(1.,1.)));
	float x1 = mix(a, b, xy.x);
	float x2 = mix(c, d, xy.x);
	return mix(x1, x2, xy.y);
}

float pNoise(vec2 p, int res){
	float persistance = .5;
	float n = 0.;
	float normK = 0.;
	float f = 4.;
	float amp = 1.;
	int iCount = 0;
	for (int i = 0; i<50; i++){
		n+=amp*noise(p, f);
		f*=2.;
		normK+=amp;
		amp*=persistance;
		if (iCount == res) break;
		iCount++;
	}
	float nf = n/normK;
	return nf*nf*nf*nf;
}

// Triple gradient with noise
void main() {
    vec4 finalColor;
    vec2 noiseResult = 1. * vec2(pNoise(vTexCoord * 20., 4), pNoise(vTexCoord * 20. - vec2(0., -100.*uTime), 4));
    vec2 coord = vTexCoord + noiseResult;
    if (coord.y < 0.333) {
        finalColor = mix(uColor0, uColor1, coord.y / 0.333);
    } else if (coord.y < 0.667) {
        finalColor = mix(uColor1, uColor2, (coord.y - 0.333) / 0.333);
    } else {
        finalColor = mix(uColor2, uColor3, (coord.y - 0.667) / 0.333);
    }
    // finalColor.rgb += vec3(rand(vTexCoord + vec2(uTime, 0.)) * 0.05, rand(vTexCoord * 2. + vec2(uTime, 0.)) * 0.05, rand(vTexCoord * 3. + vec2(uTime, 0.)) * 0.05);
    gl_FragColor = vec4(finalColor.rgb, 1.);
}