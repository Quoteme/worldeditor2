/**
 * UI (User Interface) module
 * @module ui
 * @file Manage the user interface
 * @author Luca Leon Happel
 * @see {@link http://threejs.org/docs | THREE.js}
 * @see {@link https://threejs.org/docs/#examples/en/controls/OrbitControls | THREE.js OrbitControls}
 * @see {@link https://github.com/quoteme/voxel-mesh | voxel-mesh}
 * @see module:map
 */

import * as THREE from './threejs/three.module.js';
import { OrbitControls } from './threejs/OrbitControls.js';
import * as MESHER from './voxel-mesh/voxelMesh.mjs';
import * as MAP from './map.mjs';

let camera, scene, renderer, controls, menu;

/**
 * Initialize the UI
 */
export function init() {
	initScene();
	window.addEventListener( 'resize', onWindowResize, false );
	animate();
}

/**
 * Initialize the scene which renders the entire map
 */
function initScene() {
	camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
	camera.position.z = 400;
	scene = new THREE.Scene();
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );
	controls = new OrbitControls( camera, renderer.domElement );

}

/**
 * Animate the scene
 */
function animate() {
	requestAnimationFrame( animate );
	controls.update();
	renderer.render( scene, camera );
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

/**
 * Creates a group of meshes that represent the Cube
 * @param {module:map.Cube} cube - The cube to be added in the scene
 * @returns {THREEjsGroup}
 */
function meshifyCube(cube) {
	let group = new THREE.Group();
	cube.voxPairs.forEach( ([v,m]) => {
		let geometry = MESHER.voxToGeometry(v, MESHER.greedy);
		geometry.computeFaceNormals();
		geometry.computeVertexNormals();
		let material = new THREE.MeshLambertMaterial({
			color: new THREE.Color(m.r,m.g,m.b),
			opacity: m.a
			});
		let mesh     = new THREE.Mesh(geometry, material);
		group.add(mesh);
	} )
	return group;
}

/**
 * Handle what happens if the user enter a file
 */
document.getElementById('load').onclick = _ => {
	let input = document.createElement('input');
		input.value = '';
		input.type = 'file';
	input.onchange = e => {
		let file = input.files[0];
		let reader = new FileReader();
		reader.readAsText(file);
		reader.onload = _ => menu = new Menu(MAP.World.fromJSON(JSON.parse(reader.result)));
		reader.onerror = _ => console.error('FILE ERROR')
	}
	input.click();
}

/**
 * Class that represents the editormenu
 */
class Menu {
	/**
	 * Create a Menu for a world
	 * @param {module:map.World} world - The world which this menu is made for
	 */
	constructor(world) {
		this.world = world;
		this.name = world.name;
		this.description = world.description;
		this.author = world.author;
		this.dimX = world.width;
		this.dimY = world.height;
		this.dimZ = world.depth;
		//
		this.addWorldToScene();
		this.cubePicker = world.cube
		window.world = this.world

		document.getElementById('newCube').onclick = _ => {
			console.log(this.world)
			this.world.addCube(MAP.Cube.empty(
											this.world.cubeWidth,
											this.world.cubeHeight,
											this.world.cubeDepth))
			this.cubePicker = this.world.cube
		}
	}

	get name() {return document.getElementById('name')}
	set name(x) {
		document.getElementById('name').value = x;
		this.world.name = x;
	}
	get description() {return document.getElementById('description')}
	set description(x) {
		document.getElementById('description').value = x;
		this.world.description = x;
	}
	get author() {return document.getElementById('author')}
	set author(x) {
		document.getElementById('author').value = x;
		this.world.author = author;
	}
	get dimX() {return document.getElementById('dimX')}
	set dimX(x) {
		document.getElementById('dimX').value = x;
		// TODO: change world size
	}
	get dimY() {return document.getElementById('dimY')}
	set dimY(x) {
		document.getElementById('dimY').value = x;
		// TODO: change world size
	}
	get dimZ() {return document.getElementById('dimZ')}
	set dimZ(x) {
		document.getElementById('dimZ').value = x;
		// TODO: change world size
	}
	get cubePicker() {return document.getElementById('cubePicker')}
	set cubePicker([...cube]) {
		this.cubePicker.innerHTML = '';
		cube.forEach( c => this.cubePicker.appendChild(new CubeMenu(c).dom) )
	}

	/**
	 * Add the world to the scene
	 */
	addWorldToScene() {
		scene.add( new THREE.AmbientLight(0xffffff, 0.5) )
		scene.add(meshifyCube(this.world.asCube));
		let light = new THREE.PointLight( 0xffffff, 1, 300 )
			light.position.set(-10,100,-20)
		scene.add(light)
	}
}

/**
 * A menu to edit information about a cube
 */
class CubeMenu {
	/**
	 * Generate a menu to edit cubes
	 * @param {module:map.Cube} cube
	 */
	constructor(cube) {
		this.cube = cube;
		this._dom = document.createElement('div');
		this._name = document.createElement('input');
		this._author = document.createElement('input');
		this._preview = new Image();

		this._dom.appendChild(this.preview);
		this._dom.appendChild(this.name);
		this._dom.appendChild(this.author);
		this._dom.classList.add('cube');
		this._author.classList.add('author');
		this._preview.classList.add('preview');
		this._name.placeholder = 'Name';
		this._author.placeholder = 'Author';

		this.name = cube.name;
		this.author = cube.author;
	}

	/**
	 * Generate the preview image of the cube
	 * this is only needed, if the image was not rendered before
	 * or if changes were made to the cube.
	 * @example
	 * // some changes were made to the cube data
	 * cube.generatePreview() // now the changes are visible
	 */
	generatePreview() {
		let camera = new THREE.OrthographicCamera(
			-this.cube.radius,this.cube.radius,-this.cube.radius,this.cube.radius, 0.1, 200)
		camera.position.set(
			this.cube.width,
			this.cube.height,
			this.cube.depth);
		camera.lookAt(new THREE.Vector3(...this.cube.center));
		let scene = new THREE.Scene();
		scene.add( new THREE.AmbientLight( 0xffffff, 0.3 ) )
		let light = new THREE.PointLight( 0xffffff,1,100 );
			light.position.set(
				-this.cube.radius*1.5,
				-this.cube.radius*1.0,
				this.cube.radius*0.5)
		scene.add(light)
		let mesh  = meshifyCube(this.cube);
		scene.add(mesh);
		console.log(mesh, this.cube);
		let renderer = new THREE.WebGLRenderer( {
				antialias: true,
				preserveDrawingBuffer: true } );
			renderer.setPixelRatio( window.devicePixelRatio );
			renderer.setSize( 150, 150 );
		renderer.render(scene, camera);
		this._preview.src = renderer.domElement.toDataURL( 'image/png' )
		this._preview.onclick = _ => this.edit();
	}

	/**
	 * Preview the cube in a small rendered image
	 */
	get preview() {
		// DEBUG:
		this._preview.onload = _ => console.log(this._preview);
		if( this._preview.src == "" )
			this.generatePreview();
		return this._preview
	}

	get name() {return this._name}
	set name(x) {this._name.value = x}

	get author() {return this._author}
	set author(x) {this._author.value = x}

	/**
	 * Getter for the HTML that represents this menu
	 */
	get dom() {return this._dom}

	/**
	 * Edit this cube
	 */
	edit() {
		console.log(this.cube);
		new CubeEditMenu(this.cube);
	}
}

/**
 * Class that represents a pop-up that allows users to edit a cube
 */
class CubeEditMenu {
	/**
	 * Create a Pop-Up that allows for editing of the supplied cube
	 * @param {module:map.Cube} cube - Cube to edit
	 */
	constructor(cube) {
		this.cube = cube;
		this._dom = document.createElement('div');
		this._popup = document.createElement('div');
		this._json = document.createElement('textarea');
		this._save = document.createElement('button');
		this._exit = document.createElement('button');

		this._dom.classList.add('CubeEditMenu')
		this._popup.classList.add('popup');
		this._json.classList.add('json');
		this._save.innerText = 'save';
		this._exit.innerText = 'exit';

		this._dom.appendChild(this._popup);
		this._popup.appendChild(this._json);
		this._popup.appendChild(this._save);
		this._popup.appendChild(this._exit);

		this.json = JSON.stringify(this.cube);
		this._exit.onclick = _ => this.exit();
		this.show();
	}

	/**
	 * returns the dom-element that represents this CubeEditMenu
	 * @returns {domElement}
	 */
	get dom() {
		return this._dom;
	}

	/**
	 * Gets the text inside the JSON element
	 */
	get json() {
		return this._json.value;
	}

	/**
	 * Sets the text inside the JSON element
	 */
	set json(v) {
		this._json.value = v;
	}

	/**
	 * Show this CubeEditMenu to the user
	 */
	show() {
		document.body.appendChild(this.dom);
		console.log(this.dom);
	}

	/**
	 * Inverse operation of show - Closes the CubeEditMenu
	 */
	hide() {
		this.dom.remove();
	}

	/**
	 * Exit the CubeEditMenu
	 */
	exit() {
		this.hide();
	}
}
