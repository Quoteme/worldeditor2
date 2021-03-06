/**
 * Map module
 * @module map
 * @file stores all the information needed to create and edit worlds.
 *       A world is just a voxel-space together with information
 *       about it (ie. a map).
 * @author Luca Leon Happel
 */

/**
 * @typedef {number} id
 */

/**
 * Class representing a world as a collection of information
 * including a 3d space with id's which point to cubes used at that
 * location
 */
export class World {
	/**
	 * Generate a world
	 * @see Cube
	 * @param {string} name='' - Name of the world
	 * @param {string} description='' - Description of this world
	 * @param {Cube[]} cube=[] - A list of cubes which are used in this world
	 * @param {id[][][]} space - A 3d Array of id's to the cube
	 *                               used at each point in space
	 */
	constructor(name='',description='',cube=[],space=[[[0]]],author='') {
		this.name = name;
		this.description = description;
		this.cube = cube;
		this.space = space;
		this.author = author;
	}

	/**
	 * Check if this world can be used go generate a voxel map.
	 * (Space must have the same dimension everywhere,
	 *  Cubes must have the same dimension, ...)
	 * @returns {boolean}
	 */
	get integrity() {
		if( this.width*this.height*this.depth != this.space.flat(2).length )
			throw "The space has unequal dimensionality";
		if (this.cube.length>0)
			if( this.cube.some( c =>   c.width  != this.cubeWidth
									|| c.height != this.cubeHeight
									|| c.depth  != this.cubeDepth) )
				throw "The cubes have unequal sizes";
		return true
	}

	/**
	 * Make the world into a cube
	 * Just replace every id in space with the corresponding cube
	 * while still keeping the same dimensionality.
	 * Then copy over name, ... to a new cube
	 * @returns { Cube }
	 */
	get asCube() {
		if( !this.integrity )
			throw "Integrtity Error: Build failed"
		return new Cube(
			this.name,
			this.description,
			new Array(this.cubeWidth*this.width)
				.fill(0).map( (_,x) => new Array(this.cubeHeight*this.height)
					.fill(0).map( (_,y) => new Array(this.cubeDepth*this.depth)
						.fill(0).map( (_,z) => {
							let id = this.space
										[Math.floor(x/this.cubeWidth)]
										[Math.floor(y/this.cubeHeight)]
										[Math.floor(z/this.cubeWidth)]
							if( id==0 )
								return new Voxel();
							else
								return this.cube[id-1].vox
										[x%this.cubeWidth]
										[y%this.cubeHeight]
										[z%this.cubeWidth]
						} ))),
			this.author)
	}

	/**
	 * Get all the voxels used in this world
	 * @returns {Voxel[]}
	 */
	get voxelTypes() {
		return this.cube
			.map( c => c.voxelTypes )
			.reduce( (a,c) => a.concat(
					c.filter(x => !a.some(y => Voxel.eq(x,y) ))),[] )
	}

	/**
	 * Width of the cubes used in this map
	 */
	get cubeWidth(){
		if( this.cube.length>0 )
			return this.cube[0].width
		else
			throw "No block defined yet, therefor no cube dimensions present"
	}

	/**
	 * Height of the cubes used in this map
	 */
	get cubeHeight(){
		if( this.cube.length>0 )
			return this.cube[0].height
		else
			throw "No block defined yet, therefor no cube dimensions present"
	}

	/**
	 * Depth of the cubes used in this map
	 */
	get cubeDepth(){
		if( this.cube.length>0 )
			return this.cube[0].depth
		else
			throw "No block defined yet, therefor no cube dimensions present"
	}

	/**
	 * Width of the world
	 */
	get width(){ return this.space.length }

	/**
	 * Height of the world
	 */
	get height(){ return this.space[0].length }

	/**
	 * Depth of the world
	 */
	get depth(){ return this.space[0][0].length }

	/**
	 * Add a cube to the list of cubes used.
	 * A cube is only compatible with a world iff it has the same
	 * dimensions as the other cubes in the world
	 * @see Cube
	 * @param {Cube}
	 */
	addCube(cube) {
		if( this.cube.length != 0 )
			if( this.cubeWidth  != cube.width
			 || this.cubeHeight != cube.height
			 || this.cubeDepth  != cube.depth)
				throw "cube dimensions do not confrom to other cubes dimensions";
		this.cube.push(cube);
	}

	/**
	 * Map every id in the space to another id
	 * @param {function(id, number, number, number) : id} f - f
	 */
	map(f) {
		return new World(
			this.name,
			this.description,
			this.cube,
			this.space
				.map( (x,i) => x
					.map( (y,j) => y
						.map( (z,k) => f(z,i,j,k) )))
		)
	}

	/**
	 * Generates a world object from a JSON file
	 * @param {json} json
	 * @returns {World}
	 */
	static fromJSON(json) {
		return new World(
			json.name,
			json.description,
			json.cube.map( c => Cube.fromJSON(c) ),
			json.space,
			json.author,
		);
	}

	/**
	 * Generate a new empty World
	 * @param {number} x - Width
	 * @param {number} y - Height
	 * @param {number} z - Depth
	 */
	static empty(x,y,z) {
		return new World('','', [], new Array(x).fill(new Array(y).fill(new Array(z).fill(0))))
	}
}

/**
 * Class representing a cube of the entire world.
 * This is a subset of the entire world.
 */
export class Cube {
	/**
	 * Create a Block
	 * @see Voxel
	 * @param {string} name='' - Name of the Cube
	 * @param {string} description='' - A short usecase for this Cube
	 * @param {Voxel[][][]} vox - Voxel data as a 3D array of voxels
	 *                            Empty elements mean no voxel present
	 * @param {string} author=''
	 */
	constructor(name='', description='', vox, author='') {
		this.name = name;
		this.description = description;
		this.vox  = vox
		this.author = author;
	}

	/**
	 * Width of the cube
	 */
	get width() { return this.vox.length }

	/**
	 * Height of the cube
	 */
	get height() { return this.vox[0].length }

	/**
	 * Depth of the cube
	 */
	get depth() { return this.vox[0][0].length }

	/**
	 * Center of the cube
	 */
	get center() { return [this.width/2, this.height/2, this.depth/2] }

	/**
	 * Radius the cube has from it's center to its corners
	 */
	get radius() { return Math.hypot(...this.center) }

	/**
	 * Get all different voxels used in this cube
	 * @returns {Voxel[]}
	 */
	get voxelTypes() {
		return this.vox.flat(2).reduce( (a,c) => {
			if( a.every( v => !Voxel.eq(v,c) ) )
				return a.concat([c])
			else
				return a
		}, [] )
			.filter( vt => vt.visible )
	}

	/**
	 * Break the voxel data down into tuples of voxels and where they appear
	 * This is used for displaying the Cube using Voxel-Mesh
	 * @example
	 * // display this cube with voxel-mesh
	 * import * as THREE from './threejs/three.module.js';
	 * import * as MESHER from './voxel-mesh/voxelMesh.mjs';
	 * let test = Cube.empty(8,8,8)
	 *                .map( (_,x,y,z) => y==x-z?new Voxel(255,255,255,1):new Voxel())
	 * let cube = new THREE.Group();
	 * test.voxPairs.forEach( ([v,m]) => {
	 *     let geometry = MESHER.voxToGeometry(v);
	 *     let material = new THREE.MeshBasicMaterial({ color: 0xffffff });
	 *     let mesh = new THREE.Mesh( geometry, material );
	 *     cube.add(mesh);
	 * })
	 * // now cube is a group of meshes which correspond to the defined Cube
	 * scene.add(cube)
	 * @returns {{ 0: boolean[][][], 1:  Voxel}}
	 */
	get voxPairs(){
		return this.voxelTypes
				.map( voxeltype => [
					this.map( v => Voxel.eq(v,voxeltype) ).vox,
					voxeltype
				] )
	}

	/**
	 * Map every voxel to some other voxel
	 * @example
	 * // Generate a triangular staircase
	 * Cube.empty(16,16,16).map( (_,x,y,z) => y==x-z?new Voxel(255,255,255,1):new Voxel())
	 * @param {function} f - Mapping from voxel to voxel.
	 * 						 Optional parameter:
	 * 						 	x - x-Position of the voxel
	 * 						 	y - y-Position of the voxel
	 * 						 	z - z-Position of the voxel
	 * @returns {Cube}
	 */
	map(f) {
		return new Cube(
			this.name,
			this.description,
			this.vox.map( (x,i) => x.map( (y,j) => y.map( (z,k) => f(z,i,j,k) ) ) ),
			this.author
		)
	}

	/**
	 * Generates a cube object from a JSON file
	 * @param {json} json
	 * @returns {Cube}
	 */
	static fromJSON(json) {
		return new Cube(
			json.name,
			json.description,
			json.vox.map( x=>x.map( y=>y.map( Voxel.fromJSON )) ),
			json.author,
		);
	}

	/**
	 * Generate an empty cube of dimension (x,y,z)
	 * @param {number} x - width
	 * @param {number} y - height
	 * @param {number} z - depth
	 */
	static empty(x,y,z) {
		return new Cube(
			'',
			'',
			new Array(x).fill(0)
				.map( _ => new Array(y).fill(0)
					.map( _ => new Array(z).fill(0)
						.map( _ => new Voxel()))),
			'')
	}
}

/**
 * A voxel is the analogue of a pixel in 3d
 */
class Voxel {
	/**
	 * Create a voxel
	 * @param {number} r=0 - Red value
	 * @param {number} g=0 - Green value
	 * @param {number} b=0 - Blue value
	 * @param {number} a=0 - Alpha/Opacity value
	 */
	constructor(r=0,g=0,b=0,a=0) {
		this.r = r;
		this.g = g;
		this.b = b;
		this.a = a;
	}

	/**
	 * Determines if this voxel is visible or not
	 * @returns {boolean}
	 */
	get visible() { return this.a!=0 }

	/**
	 * Generates a Voxel from JSON data
	 * @param {json} json - The voxel data as json
	 * @returns {Voxel}
	 */
	static fromJSON(json) {
		return new Voxel(...Object.values(json));
	}

	/**
	 * Checks if voxels are equal
	 * @param {Voxel} a - Voxel one
	 * @param {Voxel} b - Voxel two
	 * @returns {boolean}
	 */
	static eq(a,b) {
		return a.r == b.r
			&& a.g == b.g
			&& a.b == b.b
			&& a.a == b.a
	}
}

window.World = World
window.Cube = Cube
window.Voxel = Voxel
