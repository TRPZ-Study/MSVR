'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.
let reflection;
let incoming = []
let range = []

let forCameraUtils;
let newTexture;
let trianglesSystem;
let texture;

function deg2rad(angle) {
    return angle * Math.PI / 180;
}


// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iTextureBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function (vertices, textures) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textures), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }

    this.Draw = function() {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.vertexAttribPointer(shProgram.iAttribTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribTexCoord);
        
        gl.drawArrays(gl.TRIANGLES, 0, this.count);
    }
}

function StereoCamera(
    Convergence,
    EyeSeparation,
    AspectRatio,
    FOV,
    NearClippingDistance,
    FarClippingDistance
) {
    this.mConvergence = Convergence;
    this.mEyeSeparation = EyeSeparation;
    this.mAspectRatio = AspectRatio;
    this.mFOV = FOV
    this.mNearClippingDistance = NearClippingDistance;
    this.mFarClippingDistance = FarClippingDistance;
    this.mProjectionMatrix;
    this.mModelViewMatrix;

    this.ApplyLeftFrustum = function () {
        let top, bottom, left, right;

        top = this.mNearClippingDistance * Math.tan(this.mFOV / 2);
        bottom = -top;

        const a = this.mAspectRatio * Math.tan(this.mFOV / 2) * this.mConvergence;

        const b = a - this.mEyeSeparation / 2;
        const c = a + this.mEyeSeparation / 2;

        left = -b * this.mNearClippingDistance / this.mConvergence;
        right = c * this.mNearClippingDistance / this.mConvergence;

        // Set the Projection Matrix
        this.mProjectionMatrix = m4.frustum(left, right, bottom, top, this.mNearClippingDistance, this.mFarClippingDistance)
        this.mModelViewMatrix = m4.identity()

        // Displace the world to right
        m4.multiply(m4.translation(0.01 * this.mEyeSeparation / 2, 0.0, 0.0), this.mModelViewMatrix, this.mModelViewMatrix);
    }

    this.ApplyRightFrustum = function () {
        let top, bottom, left, right;

        top = this.mNearClippingDistance * Math.tan(this.mFOV / 2);
        bottom = -top;

        const a = this.mAspectRatio * Math.tan(this.mFOV / 2) * this.mConvergence;

        const b = a - this.mEyeSeparation / 2;
        const c = a + this.mEyeSeparation / 2;

        left = -c * this.mNearClippingDistance / this.mConvergence;
        right = b * this.mNearClippingDistance / this.mConvergence;

        // Set the Projection Matrix
        this.mProjectionMatrix = m4.frustum(left, right, bottom, top, this.mNearClippingDistance, this.mFarClippingDistance)
        this.mModelViewMatrix = m4.identity()

        // Displace the world to left
        m4.multiply(m4.translation(-0.01 * this.mEyeSeparation / 2, 0.0, 0.0), this.mModelViewMatrix, this.mModelViewMatrix);
    }
}


// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    // Location of the uniform specifying a color for the primitive.
    this.iColor = -1;
    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewProjectionMatrix = -1;
    //this.iNormalMatrix = -1;

    this.Use = function () {
        gl.useProgram(this.prog);
    }
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Set the values of the projection transformation */
    let projection = m4.orthographic(-3, 3, -3, 3, -3, 14)
    // let projection = m4.orthographic(-3, 3, -3, 3, -3, 3);

    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translateToPointZero = m4.translation(0, 0, -10);
    //let translateToPointZero = m4.translation(0,0,-5);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);

    //new
    gl.uniform4fv(shProgram.iColor, [1, 1, 1, 1]);


    //let modelViewProjection = m4.multiply(projection, matAccum1);
    // const normalMatrix = m4.identity();
    // m4.inverse(modelView, normalMatrix);
    // m4.transpose(normalMatrix, normalMatrix);

    let modelViewProjection = m4.identity()
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    gl.bindTexture(gl.TEXTURE_2D, newTexture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        forCameraUtils
    );
    trianglesSystem.Draw()
    gl.clear(gl.DEPTH_BUFFER_BIT);


    modelViewProjection = m4.multiply(projection, matAccum1 );


    //new
    reflection.ApplyLeftFrustum()
    modelViewProjection = m4.multiply(reflection.mProjectionMatrix, m4.multiply(reflection.mModelViewMatrix, matAccum1));


    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    //gl.uniformMatrix4fv(shProgram.iNormalMatrix, false, modelViewProjection);
    //gl.uniform4fv(shProgram.iColor, [1, 1, 0, 1]);

    //new
    gl.colorMask(true, false, false, false);

    gl.bindTexture(gl.TEXTURE_2D, texture);


    surface.Draw();

    gl.clear(gl.DEPTH_BUFFER_BIT);

    //друге
    reflection.ApplyRightFrustum()
    modelViewProjection = m4.multiply(reflection.mProjectionMatrix, m4.multiply(reflection.mModelViewMatrix, matAccum1));
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    gl.colorMask(false, true, true, false);
    surface.Draw();
    gl.colorMask(true, true, true, true);
}

function CreateSurfaceData() {
    let a = 2;
    let vertexList = [];
    // let normalList = [];
    let vertexTexCoordList = [];
    let numSteps1 = 0, numSteps2 = 0;
    // Значення параметра u
    const uMin = -Math.PI;
    const uMax = Math.PI;
    // Значення параметра v
    const vMin = -2;
    const vMax = 0;

    for (let i = -1; i < 1; i += 0.05) {
        const u1 = uMin + (uMax - uMin) * (i / numSteps1);
        const u2 = uMin + (uMax - uMin) * ((i + 1) / numSteps1);
        numSteps1++;
        numSteps2 = 0;
        for (let j = 0; j < Math.PI * 2; j += 0.1) {
            const v1 = vMin + (vMax - vMin) * (j / numSteps2);
            const v2 = vMin + (vMax - vMin) * ((j + 1) / numSteps2);
            let temp = vertex(j, i, 2);
            let temp2 = vertex(j + 0.1, i, 2);
            let temp3 = vertex(j, i + 0.05, 2);
            let temp4 = vertex(j + 0.1, i + 0.05, 2);
            vertexList.push(temp.x, temp.y, temp.z);
            vertexList.push(temp2.x, temp2.y, temp2.z);
            vertexList.push(temp3.x, temp3.y, temp3.z);
            vertexList.push(temp3.x, temp3.y, temp3.z);
            vertexList.push(temp4.x, temp4.y, temp4.z);
            vertexList.push(temp2.x, temp2.y, temp2.z);
            
            
            // let v21 = { x: temp2.x - temp.x, y: temp2.y - temp.y, z: temp2.z - temp.z },
            // v31 = { x: temp3.x - temp.x, y: temp3.y - temp.y, z: temp3.z - temp.z },
            // v42 = { x: temp4.x - temp2.x, y: temp4.y - temp2.y, z: temp4.z - temp2.z },
            // v32 = { x: temp3.x - temp2.x, y: temp3.y - temp2.y, z: temp3.z - temp2.z };
            // let n1 = cross(v21, v31),
            // n2 = cross(v42, v32);
            // normalization(n1);
            // normalization(n2);

            // normalList.push(n1.x, n1.y, n1.z)
            // normalList.push(n1.x, n1.y, n1.z)
            // normalList.push(n1.x, n1.y, n1.z)
            // normalList.push(n2.x, n2.y, n2.z)
            // normalList.push(n2.x, n2.y, n2.z)
            // normalList.push(n2.x, n2.y, n2.z)

            vertexTexCoordList.push(map(u1, -Math.PI, Math.PI, 0, 1), map(v1, -a, 0, 0, 1));
            vertexTexCoordList.push(map(u2, -Math.PI, Math.PI, 0, 1), map(v1, -a, 0, 0, 1));
            vertexTexCoordList.push(map(u1, -Math.PI, Math.PI, 0, 1), map(v2, -a, 0, 0, 1));
            vertexTexCoordList.push(map(u1, -Math.PI, Math.PI, 0, 1), map(v2, -a, 0, 0, 1));
            vertexTexCoordList.push(map(u2, -Math.PI, Math.PI, 0, 1), map(v1, -a, 0, 0, 1));
            vertexTexCoordList.push(map(u2, -Math.PI, Math.PI, 0, 1), map(v2, -a, 0, 0, 1));
            numSteps2++;
        }
    }

    return [vertexList, vertexTexCoordList];
}


function getDerivative1(a, ω1, u1, v, delta) {
    let [x, y, z]  = creating(a, ω1, u1 + delta, v);
    let x0 = x / deg2rad(delta);
    let y0 = y / deg2rad(delta);
    let z0 = z / deg2rad(delta);
    return [x0,y0,z0];
}

function getDerivative2(a, ω1, u1, v, delta) {
    let [x, y, z] = creating(a, ω1, u1, v + delta);
    let x0 = x / deg2rad(delta);
    let y0 = y / deg2rad(delta);
    let z0 = z / deg2rad(delta);
    return [x0,y0,z0];
}

// function CreateSurfaceData() {
//     //Побудова власне фігури
//     let a = 2;
//     let p = 1;

//     let normalsList =[];
//     let vertexList = [];
//     let vertexTexCoordList = [];

//     let numSteps = 50; // Кількість кроків

//     // Значення параметра u
//     const uMin = -Math.PI;
//     const uMax = Math.PI;
//     // Значення параметра v
//     const vMin = -2;
//     const vMax = 0;
//     let delta = 0.0001;

//     for (let i = 0; i < numSteps; i++) {
//         const u1 = uMin + (uMax - uMin) * (i / numSteps);
//         const u2 = uMin + (uMax - uMin) * ((i + 1) / numSteps);

//         for (let j = 0; j < numSteps; j++) {
//             const v1 = vMin + (vMax - vMin) * (j / numSteps);
//             const v2 = vMin + (vMax - vMin) * ((j + 1) / numSteps);

//             let ω1 = p * u1;
//             let [x1, y1, z1] = creating(a, ω1, u1, v1);
//             let derivative1 = getDerivative1(a, ω1, u1, v1, delta);
//             let derivative2 = getDerivative2(a, ω1, u1, v1, delta);
//             let normal1 = m4.cross(derivative1,derivative2);

//             let ω2 = p * u2;
//             let [x2, y2, z2] = creating(a, ω2, u2, v1);
//             derivative1 = getDerivative1(a, ω2, u2, v1, delta);
//             derivative2 = getDerivative2(a, ω2, u2, v1, delta);
//             let normal2 = m4.cross(derivative1,derivative2);

//             ω1 = p * u1;
//             let [x3, y3, z3] = creating(a, ω1, u1, v2);
//             derivative1 = getDerivative1(a, ω1, u1, v2, delta);
//             derivative2 = getDerivative2(a, ω1, u1, v2, delta);
//             let normal3 = m4.cross(derivative1,derivative2);

//             ω2 = p * u2;
//             let [x4, y4, z4] = creating(a, ω2, u2, v2);
//             derivative1 = getDerivative1(a, ω2, u2, v2, delta);
//             derivative2 = getDerivative2(a, ω2, u2, v2, delta);
//             let normal4 = m4.cross(derivative1,derivative2);

//             vertexList.push(x1, y1, z1, x2, y2, z2, x3, y3, z3, x3, y3, z3, x2, y2, z2, x4, y4, z4);
//             normalsList.push(normal1[0],normal1[1],normal1[2], normal2[0],normal2[1],normal2[2],normal3[0],
//                 normal3[1],normal3[2],normal3[0],normal3[1],normal3[2], normal2[0],normal2[1],normal2[2], normal4[0],normal4[1],normal4[2]);

//             vertexTexCoordList.push(map(u1, -Math.PI, Math.PI, 0, 1), map(v1, -a, 0, 0, 1));
//             vertexTexCoordList.push(map(u2, -Math.PI, Math.PI, 0, 1), map(v1, -a, 0, 0, 1));
//             vertexTexCoordList.push(map(u1, -Math.PI, Math.PI, 0, 1), map(v2, -a, 0, 0, 1));
//             vertexTexCoordList.push(map(u1, -Math.PI, Math.PI, 0, 1), map(v2, -a, 0, 0, 1));
//             vertexTexCoordList.push(map(u2, -Math.PI, Math.PI, 0, 1), map(v1, -a, 0, 0, 1));
//             vertexTexCoordList.push(map(u2, -Math.PI, Math.PI, 0, 1), map(v2, -a, 0, 0, 1));
//         }
//     }
//     return [vertexList, vertexTexCoordList];
// }

function map(value, a, b, c, d) {
    value = (value - a) / (b - a);
    return c + value * (d - c);
}

function creating(a, ω1, u1, v1){
    const x1 = (a + v1) * Math.cos(ω1) * Math.cos(u1);
    const y1 = (a + v1) * Math.cos(ω1) * Math.sin(u1);
    const z1 = (a + v1) * Math.sin(ω1);
    return [x1, y1, z1]
}

const radius = 0.1;
function getSphereVertex(long, lat) {
    return {
        x: radius * Math.cos(long) * Math.sin(lat),
        y: radius * Math.sin(long) * Math.sin(lat),
        z: radius * Math.cos(lat)
    }
}

function map(value, a, b, c, d) {
    value = (value - a) / (b - a);
    return c + value * (d - c);
}

function vertex(u, t, ti) {
    let x = ((0.8 + t * Math.cos(0.2 * Math.PI) + 2 * Math.pow(t, 2) * Math.sin(0.2 * Math.PI)) * Math.cos(u)) / ti,
        y = ((0.8 + t * Math.cos(0.2 * Math.PI) + 2 * Math.pow(t, 2) * Math.sin(0.2 * Math.PI)) * Math.sin(u)) / ti,
        z = (-t * Math.sin(0.2 * Math.PI) + 2 * Math.pow(t, 2) * Math.cos(0.2 * Math.PI)) / ti;
    return { x: x, y: y, z: z }
}

function cross(a, b) {
    let x = a.y * b.z - b.y * a.z;
    let y = a.z * b.x - b.z * a.x;
    let z = a.x * b.y - b.x * a.y;
    return { x: x, y: y, z: z }
}

// function normalization(a) {
//     var len = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
//     a.x /= len; a.y /= len; a.z /= len;
// }

/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribTexCoord = gl.getAttribLocation(prog, "texture");
    //shProgram.iAttribNormal = gl.getAttribLocation(prog, "normal");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    //shProgram.iNormalMatrix = gl.getUniformLocation(prog, "NormalMatrix");
    shProgram.iColor = gl.getUniformLocation(prog, "color");

    reflection = new StereoCamera(parseFloat(incoming[3].value), parseFloat(incoming[0].value), 1, parseFloat(incoming[1].value), parseFloat(incoming[2].value), 50)

    surface = new Model('Surface');
    // let sur = CreateSurfaceData();
    // surface.BufferData(sur[0], sur[1]);
    surface.BufferData(...CreateSurfaceData());

    trianglesSystem = new Model('Two triangles');
    trianglesSystem.BufferData(
        [-1, -1, 0, 1, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1, 1, 0],
        [1, 1, 0, 0, 0, 1, 0, 0, 1, 1, 1, 0]
    )
    
    gl.enable(gl.DEPTH_TEST);
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    incoming.push(document.getElementById('es'))
    incoming.push(document.getElementById('fov'))
    incoming.push(document.getElementById('ncd'))
    incoming.push(document.getElementById('c'))
    range.push(document.getElementById('es1'))
    range.push(document.getElementById('fov1'))
    range.push(document.getElementById('ncd1'))
    range.push(document.getElementById('c1'))
    incoming.forEach((i, ind) => {
        i.onchange = (e) => {
            range[ind].innerHTML = i.value
            reflection.mEyeSeparation = parseFloat(incoming[0].value)
            reflection.mFOV = parseFloat(incoming[1].value)
            reflection.mNearClippingDistance = parseFloat(incoming[2].value)
            reflection.mConvergence = parseFloat(incoming[3].value)
            draw()
        }
    })


    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");

        forCameraUtils = readCamera()
        newTexture = CreateCameraTexture()

        if (!gl) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);

    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const textureImage = new Image();
    textureImage.crossOrigin = 'anonymus';
    textureImage.src = "https://i.imgur.com/EnUHjnt.jpg";
    textureImage.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            textureImage
        );
        draw()
    }


    
    animating();
}

function animating() {
    draw()
    window.requestAnimationFrame(animating)
}