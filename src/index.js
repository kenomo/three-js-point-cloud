import {
  Scene,
  Color,
  PerspectiveCamera,
  BoxBufferGeometry,
  MeshStandardMaterial,
  Mesh,
  WebGLRenderer,
  DirectionalLight,
  HemisphereLight,
  AmbientLight,
  TextureLoader,
  sRGBEncoding,
  TorusGeometry,
  PointsMaterial,
  Points,
  Vector3,
  Object3D,
  BoxGeometry,
  MeshBasicMaterial,
  BufferGeometry,
  BufferAttribute,
  Float32BufferAttribute,
  ShaderMaterial,
  ShaderLib
} from "three";
import { MeshSurfaceSampler } from "./MeshSurfaceSampler";
import OrbitControls from "three-orbitcontrols";
import { getGPUTier } from "detect-gpu";

const gpu = getGPUTier();
console.log(gpu);

let container;
let camera;
let renderer;
let scene;
let controls;
let currentPoints = 0;

let MAX_POINTS = 100000;
let geometry = new BufferGeometry();

let positions = new Float32Array(MAX_POINTS * 3);
let colors = new Float32Array(MAX_POINTS * 3);

//const positions = [];
//const colors = [];

geometry.setAttribute("position", new BufferAttribute(positions, 3));
geometry.setAttribute("color", new BufferAttribute(colors, 3));

let pointsMaterial = new PointsMaterial({
  vertexColors: true,
  size: 0.25,
  sizeAttenuation: true
  //alphaTest: 0.5,
  //transparent: true
});

var roundFragmentShader = /* glsl */ `

uniform vec3 diffuse;
uniform float opacity;

#include <common>

#include <color_pars_fragment>

void main() {

	vec3 outgoingLight = vec3( 0.0 );
  vec4 diffuseColor = vec4( diffuse, opacity );
  
	#include <color_fragment>
  
  outgoingLight = diffuseColor.rgb;
  
	#include <output_fragment>

  // https://stackoverflow.com/a/54361382
  if (distance(gl_PointCoord, vec2(0.5)) > 0.4) discard;

}

`;

let material = new ShaderMaterial({
  uniforms: {
    size: { value: 5 },
    scale: { value: 10 },
    diffuse: { value: [1.0, 1.0, 1.0] },
    opacity: { value: 0.1 }
  },
  defines: {
    USE_SIZEATTENUATION: true,
    USE_COLOR: true
  },

  // https://github.com/mrdoob/three.js/blob/r140/src/renderers/shaders/ShaderLib/points.glsl.js
  vertexShader: ShaderLib.points.vertexShader,
  fragmentShader: roundFragmentShader
});

let pointCloud = new Points(geometry, material);
pointCloud.geometry.setDrawRange(0, 0);

function init() {
  container = document.querySelector("#scene-container");

  // Creating the scene
  scene = new Scene();
  scene.background = new Color("skyblue");
  scene.add(pointCloud);

  createCamera();
  createLights();
  createControls();
  createRenderer();

  renderer.setAnimationLoop(() => {
    update();
    render();
    addPoints(10000);
  });
}

function createCamera() {
  const fov = 35;
  const aspect = container.clientWidth / container.clientHeight;
  const near = 0.1;
  const far = 100;
  camera = new PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(-2, 2, 10);
}

function createLights() {
  const mainLight = new DirectionalLight(0xffffff, 5);
  mainLight.position.set(10, 10, 10);

  const hemisphereLight = new HemisphereLight(0xddeeff, 0x202020, 5);
  scene.add(mainLight, hemisphereLight);
}

let finished = false;

function addPoints(num) {
  if (currentPoints + num >= MAX_POINTS) {
    if (!finished) console.log("FINISHED");
    finished = true;
    return;
  }

  for (let i = 0; i < num; i++) {
    var x = (Math.random() - 0.5) * 10;
    var y = (Math.random() - 0.5) * 10;
    var z = (Math.random() - 0.5) * 10;

    var vx = Math.random();
    var vy = Math.random();
    var vz = Math.random();

    positions[currentPoints * 3 + 0] = x;
    positions[currentPoints * 3 + 1] = y;
    positions[currentPoints * 3 + 2] = z;

    colors[currentPoints * 3 + 0] = vx;
    colors[currentPoints * 3 + 1] = vy;
    colors[currentPoints * 3 + 2] = vz;

    currentPoints++;
  }

  pointCloud.geometry.attributes.position.needsUpdate = true;
  pointCloud.geometry.attributes.color.needsUpdate = true;
  pointCloud.geometry.setDrawRange(0, currentPoints);
}

function createRenderer() {
  renderer = new WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.gammaFactor = 2.2;
  renderer.gammaOutput = true;
  renderer.physicallyCorrectLights = true;

  container.appendChild(renderer.domElement);
}

function createControls() {
  controls = new OrbitControls(camera, container);
}

function update() {
  //let material = new PointsMaterial({ color: 0xFFFFFF, size: 0.25 })
  //mesh = new Points(geometry, material)
  //scene.add(mesh)
  //pointCloud.rotation.x += 0.003;
  //pointCloud.rotation.y += 0.003;
  //pointCloud.rotation.z += 0.003;
}

function render() {
  controls.update();
  renderer.render(scene, camera);
}

init();

function onWindowResize() {
  camera.aspect = container.clientWidth / container.clientHeight;

  // Update camera frustum
  camera.updateProjectionMatrix();

  renderer.setSize(container.clientWidth, container.clientHeight);
}
window.addEventListener("resize", onWindowResize, false);
