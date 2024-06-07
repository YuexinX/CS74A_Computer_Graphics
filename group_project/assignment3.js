import {defs, tiny} from './examples/common.js';
 import { Shape_From_File } from './examples/obj-file-demo.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

const {Cube, Axis_Arrows, Textured_Phong} = defs




export class Assignment3 extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
        this.ball_sound = new Audio("assets/ball.mp3"); 
        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            torus: new defs.Torus(15, 15),
            torus2: new defs.Torus(3, 15),
            sphere: new defs.Subdivision_Sphere(4),
            circle: new defs.Regular_2D_Polygon(1, 15),

            piler: new defs.Capped_Cylinder(20,20),
            platform: new Shape_From_File("./assets/platform.obj"),
            background: new defs.Cube(),
            square: new defs.Square(),
            deathZone: new Shape_From_File("./assets/deathZone-test.obj")
        };

        // *** Materials
        this.materials = {
            test: new Material(new defs.Phong_Shader(),
                {ambient: 0.4, diffusivity: 0.6, color: hex_color("#ffffff"), specularity: 0}),
            test2: new Material(new Gouraud_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#992828")}),
            ring: new Material(new Ring_Shader()),
            // TODO:  Fill in as many additional material objects as needed in this key/value table.
            //        (Requirement 4)
            sphere: new Material(new defs.Phong_Shader(),
                {ambient: 0.8, diffusivity: 0.6, color: hex_color("#5BAEB7"), specularity: 1}),

            default: new Material(new Textured_Phong(), {
                color: hex_color("#111111"),
                ambient: 1,
                specularity: 0,
                texture: new Texture("assets/blue-sky2.png", "NEAREST")
            }),
            gameover: new Material(new defs.Textured_Phong(1), 
                {ambient: 1, specularity: 0, texture: new Texture("assets/gameover.png")}),
        }
        this.angle = 0;

        this.ball_maxspeed = 13;
        //this.ball_pos = vec3(0, 5.5, 7.5);
        this.ball_pos = vec3(0, 17.5, 7.5);
        this.ball_speed = vec3(0, 0, 0);//gravity: constant
        this.ball_g = -30; 

        //platform info
        this.platform_y = new Set();
        this.init = true;
        this.randAngle = 1;
        //this.platform_angle = [[1.8*Math.PI, 1.5*Math.PI],[0.23*Math.PI, 1.9*Math.PI],[1.96*Math.PI, 1.65*Math.PI],[1.36*Math.PI, 1.03*Math.PI]];
        this.platform_angle = [[1.8*Math.PI, 1.5*Math.PI],[2.0*Math.PI, 1.9*Math.PI],[1.9*Math.PI, 1.65*Math.PI],[1.36*Math.PI, 1.03*Math.PI],[1.92*Math.PI, 1.6*Math.PI]];
        this.deathZone_angle = [[1.3*Math.PI, 1.6*Math.PI], [1.6*Math.PI, 1.3*Math.PI], [1.3*Math.PI, Math.PI], [0.9*Math.PI, 0.6*Math.PI],[1.65*Math.PI, 1.92*Math.PI]];
        this.currPlat = 0;
        this.tempPlatY = 16; // for temporary storing estimated y value of platforms, -6 go to the next platform

         // scoreboard 
         this.score = 0;
         this.lives = 3;
         this.scoreElement = document.getElementById("score");
         this.livesElement = document.getElementById("lives");
         this.scoreNode = document.createTextNode("");
         this.livesNode = document.createTextNode("");
         this.scoreElement.appendChild(this.scoreNode);
         this.livesElement.appendChild(this.livesNode);

         //this.color = color(0.62, 0.89, 0.83, 1);
         this.color = color(0.10, 0.92, 0.91, 1);
         this.initial_camera_location = Mat4.look_at(vec3(0, 12, 30), vec3(0, 0, 0), vec3(0, 1, 0));
    }

    set_colors() {
        this.color = color(Math.random(), Math.random(), Math.random(), 1.0);
        console.log(this.color)
    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("View whole system", ["Control", "0"], () => this.attached = () => this.initial_camera_location);
        this.new_line();
        this.key_triggered_button("rotate left", ["Control","a"], () => {
            if (this.angle-(Math.PI/30) < 0){
                let newAngle1 = Math.PI/30 - this.angle;
                this.angle = 2*Math.PI - newAngle1;
            }
            else{
                this.angle -= Math.PI / 30;
            }

        });
        this.key_triggered_button("rotate right", ["Control","d"], () => {
            if (this.angle + (Math.PI/30) > (2*Math.PI)){
                let newAngle2 = (this.angle + (Math.PI/30))-2*Math.PI;
                this.angle = newAngle2;
            }
            else {
                this.angle += Math.PI / 30;
            }
        });
        this.new_line();
        this.key_triggered_button("Attach to ball", ["Control", "3"], () => this.attached = () => this.ball);
        this.key_triggered_button("Change Colors", ["Control", "w"], this.set_colors);
    }

    draw_unit(context, program_state){
        const yellow = hex_color("#fac91a");
        const grey = hex_color("#3b3b3b");
        const red = hex_color("#ff0000");
        let model_transform = Mat4.identity();

        model_transform = model_transform.times(Mat4.rotation(Math.PI/2,1,0,0))
            .times(Mat4.scale(1,1,20));
        this.shapes.piler.draw(context, program_state, model_transform, this.materials.test);



        let platForm_transform = Mat4.identity();
        platForm_transform = platForm_transform.times(Mat4.scale(2.5,1,2.5))
            .times(Mat4.translation(0,-7.5,0))
            .times(Mat4.rotation(Math.PI/15, 0, 1, 0))
            .times(Mat4.rotation(this.angle,0,1,0));


        platForm_transform = platForm_transform.times(Mat4.translation(0,3,0));
        this.shapes.platform.draw(context, program_state, platForm_transform, this.materials.test.override({color: grey}));
        // console.log(platForm_transform[1][3]);


        let platForm1_transform = platForm_transform;
        let platForm2_transform = platForm_transform;
        let platForm3_transform = platForm_transform;
        let platForm4_transform = platForm_transform;

        platForm1_transform = platForm1_transform.times(Mat4.rotation(Math.PI/2, 0, 1, 0))
            .times(Mat4.translation(0,3,0));
                                                //.times(Mat4.rotation(Math.PI/11,0,1,0));
        let y1 = platForm_transform[1][3];
        this.platform_y.add(y1);
        this.shapes.platform.draw(context, program_state, platForm1_transform, this.materials.test.override({color: grey}));

        let deathZone_transform = Mat4.identity();
        deathZone_transform = deathZone_transform.times(Mat4.rotation(this.angle,0,1,0))
            .times(Mat4.rotation(Math.PI/2, 0, 1, 0))
            .times(Mat4.rotation(Math.PI/3, 0, 1, 0))
            .times(Mat4.scale(2.3,1,2.3))
            .times(Mat4.translation(0.8,-1.5,0.4));

        this.shapes.deathZone.draw(context, program_state, deathZone_transform, this.materials.test.override({color: red}));
        this.shapes.platform.draw(context, program_state, platForm_transform, this.materials.test.override({color: grey}));
        // console.log(platForm_transform[1][3]);





        platForm2_transform = platForm2_transform.times(Mat4.rotation(-Math.PI/15, 0, 1, 0))
            .times(Mat4.translation(0,6,0));
                                                //.times(Mat4.rotation(Math.PI/randAngle,0,1,0));
        let y2 = platForm_transform[1][3];
        this.platform_y.add(y2);
        this.shapes.platform.draw(context, program_state, platForm2_transform, this.materials.test.override({color: grey}));

        deathZone_transform = deathZone_transform.times(Mat4.translation(-0.8, 1.5, -0.4))
            .times(Mat4.scale(1/2.3, 1, 1/2.3))
            .times(Mat4.rotation(-Math.PI/15, 0,1,0))
            .times(Mat4.rotation(-Math.PI/3, 0, 1, 0))
            .times(Mat4.scale(2.3,1,2.3))
            .times(Mat4.translation(0.8,1.5,0.3));

        this.shapes.deathZone.draw(context, program_state, deathZone_transform, this.materials.test.override({color: red}));

        platForm3_transform = platForm3_transform.times(Mat4.rotation(-Math.PI/3, 0, 1, 0))
            .times(Mat4.translation(0,9,0));

        let y3 = platForm_transform[1][3];
        this.platform_y.add(y3);
        this.shapes.platform.draw(context, program_state, platForm3_transform, this.materials.test.override({color: grey}));

        deathZone_transform = deathZone_transform.times(Mat4.translation(-0.8, -1.5, -0.4))
            .times(Mat4.scale(1/2.3, 1, 1/2.3))
            .times(Mat4.rotation(-Math.PI/4, 0, 1, 0))
            .times(Mat4.scale(2.3,1,2.3))
            .times(Mat4.translation(0.8,4.5,0.3));

        this.shapes.deathZone.draw(context, program_state, deathZone_transform, this.materials.test.override({color: red}));


        platForm4_transform = platForm4_transform.times(Mat4.translation(0,12,0));
        let y4 = platForm_transform[1][3];
        this.platform_y.add(y4);
        this.shapes.platform.draw(context, program_state, platForm4_transform, this.materials.test.override({color: grey}));

        platForm_transform = platForm4_transform.times(Mat4.translation(0,3,0));
        this.shapes.platform.draw(context, program_state, platForm_transform, this.materials.test.override({color: grey}));


    }


    display(context, program_state) {
        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(this.initial_camera_location);
        }

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);


        const light_position = vec4(0, 5, 30, 1);

        // The parameters of the Light are: position, color, size
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 100000)];

        this.draw_unit(context, program_state);

        //background
        let background_transform = Mat4.identity();
        background_transform = background_transform.times(Mat4.scale(45,40,0.8))
            .times(Mat4.translation(0,0,-20));
        this.shapes.background.draw(context, program_state, background_transform, this.materials.default);

        const positions = Array.from(this.platform_y);
        //y coordinate of the lowest platform;

        const bottom = positions[0];
        const t = this.t = program_state.animation_time / 1000;
        const dt = this.dt = program_state.animation_delta_time / 1000;


        // make the score & lives integer
        this.scoreNode.nodeValue = this.score.toFixed(0);  
    	this.livesNode.nodeValue = this.lives.toFixed(0);
        //this.collision(program_state);

        let ball_transform = Mat4.identity();
        //let control = 1;
        //let fall_factor = 20*(t%1.5);

        

       //ball_transform = ball_transform.times(Mat4.scale(0.4,0.4,0.4))
         //   .times(Mat4.translation(0,18-fall_factor,5));

        // check if at gap
        // change to angle of specific platform, platform # + 1
        //console.log(this.angle);
        if (this.angle < this.platform_angle[this.currPlat][0] && this.angle > this.platform_angle[this.currPlat][1]) {
        //if ((this.angle > Math.PI/3 && this.angle < Math.PI/2 )) {

                // drop to next level, score + 1
                if (this.ball_pos[1] < -2) {
                    this.ball_pos[1] = 18;
                } else {
                    this.ball_pos = this.ball_pos.plus(this.ball_speed.times(this.dt));
                }
                this.ball_speed[1] = this.ball_speed[1] + this.dt * this.ball_g;

                ball_transform = ball_transform.times(Mat4.scale(0.5,0.5,0.5))
                    .times(Mat4.translation(this.ball_pos[0], this.ball_pos[1], this.ball_pos[2]));
                // change according to the total number of platforms
                if (this.currPlat === 4) {
                    this.currPlat = 0;
                } else {
                    this.currPlat += 1;
                }
                // change according to the y coordinate of lowest platform
                if (this.tempPlatY === -8) {
                    this.tempPlatY = 16;
                } else {
                    this.tempPlatY -= 6
                }

                this.score += 1;
        }
        else if (this.angle < this.deathZone_angle[this.currPlat][0] && this.angle > this.deathZone_angle[this.currPlat][1]) {
            if (this.lives === 0) {
                // "game over"
                let game_over = Mat4.identity().times(Mat4.translation(-21,16,4,0))
                        .times(Mat4.scale(7,7,2,5))
                        .times(Mat4.translation(3,-2,1,0));
                this.shapes.square.draw(context, program_state, game_over, this.materials.gameover);
            }
            else { // keep bouncing but lives -1
                this.ball_pos = this.ball_pos.plus(this.ball_speed.times(this.dt));
                this.ball_speed[1] = this.ball_speed[1] + this.dt * this.ball_g;
                //console.log(this.platform_y);
                // use the array, select the next value if the ball falls to the next platform
                // steps: 1. randomly switch effects of falling and bouncing
                // 2. array for y values & rotation angles array, angle variable
                if (this.ball_pos[1] < this.tempPlatY) {
                    this.ball_pos[1] = this.tempPlatY;
                    this.ball_speed[1] = this.ball_maxspeed;
                    this.lives -= 1;
                    this.ball_sound.play();
                    
                }
                ball_transform = ball_transform.times(Mat4.scale(0.5, 0.5, 0.5))
                    .times(Mat4.translation(this.ball_pos[0], this.ball_pos[1], this.ball_pos[2]));

                // lives -1
                //this.lives -= 1;
            }
        }
        else {
                // if not at gap, bounce
                // bounce effect
                this.ball_pos = this.ball_pos.plus(this.ball_speed.times(this.dt));
                this.ball_speed[1] = this.ball_speed[1] + this.dt * this.ball_g;
                //console.log(this.platform_y);
                // use the array, select the next value if the ball falls to the next platform
                // steps: 1. randomly switch effects of falling and bouncing
                // 2. array for y values & rotation angles array, angle variable
                if (this.ball_pos[1] < this.tempPlatY){
                    this.ball_pos[1] = this.tempPlatY;
                    this.ball_speed[1] = this.ball_maxspeed;
                    this.ball_sound.play();
                }
                ball_transform = ball_transform.times(Mat4.scale(0.5,0.5,0.5))
                    .times(Mat4.translation(this.ball_pos[0], this.ball_pos[1], this.ball_pos[2]));
        }

        console.log(this.angle);
        //console.log(this.platform_y)
        // red zone (bounce and this.lives - 1)
        

        this.shapes.sphere.draw(context, program_state, ball_transform, this.materials.sphere.override({color:this.color}));


        this.ball = Mat4.inverse(ball_transform.times(Mat4.translation(0,0,20)));

        if(this.attached !== undefined){
            program_state.camera_inverse =  this.attached();
        }

    }
}

class Gouraud_Shader extends Shader {
    // This is a Shader using Phong_Shader as template
    // TODO: Modify the glsl coder here to create a Gouraud Shader (Planet 2)

    constructor(num_lights = 2) {
        super();
        this.num_lights = num_lights;
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return ` 
        precision mediump float;
        const int N_LIGHTS = ` + this.num_lights + `;
        uniform float ambient, diffusivity, specularity, smoothness;
        uniform vec4 light_positions_or_vectors[N_LIGHTS], light_colors[N_LIGHTS];
        uniform float light_attenuation_factors[N_LIGHTS];
        uniform vec4 shape_color;
        uniform vec3 squared_scale, camera_center;

        // Specifier "varying" means a variable's final value will be passed from the vertex shader
        // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the
        // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
        varying vec3 N, vertex_worldspace;
        // ***** PHONG SHADING HAPPENS HERE: *****                                       
        vec3 phong_model_lights( vec3 N, vec3 vertex_worldspace ){                                        
            // phong_model_lights():  Add up the lights' contributions.
            vec3 E = normalize( camera_center - vertex_worldspace );
            vec3 result = vec3( 0.0 );
            for(int i = 0; i < N_LIGHTS; i++){
                // Lights store homogeneous coords - either a position or vector.  If w is 0, the 
                // light will appear directional (uniform direction from all points), and we 
                // simply obtain a vector towards the light by directly using the stored value.
                // Otherwise if w is 1 it will appear as a point light -- compute the vector to 
                // the point light's location from the current surface point.  In either case, 
                // fade (attenuate) the light as the vector needed to reach it gets longer.  
                vec3 surface_to_light_vector = light_positions_or_vectors[i].xyz - 
                                               light_positions_or_vectors[i].w * vertex_worldspace;                                             
                float distance_to_light = length( surface_to_light_vector );

                vec3 L = normalize( surface_to_light_vector );
                vec3 H = normalize( L + E );
                // Compute the diffuse and specular components from the Phong
                // Reflection Model, using Blinn's "halfway vector" method:
                float diffuse  =      max( dot( N, L ), 0.0 );
                float specular = pow( max( dot( N, H ), 0.0 ), smoothness );
                float attenuation = 1.0 / (1.0 + light_attenuation_factors[i] * distance_to_light * distance_to_light );
                
                vec3 light_contribution = shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse
                                                          + light_colors[i].xyz * specularity * specular;
                result += attenuation * light_contribution;
            }
            return result;
        } `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        return this.shared_glsl_code() + `
            attribute vec3 position, normal;                            
            // Position is expressed in object coordinates.
            
            uniform mat4 model_transform;
            uniform mat4 projection_camera_model_transform;
    
            void main(){                                                                   
                // The vertex's final resting place (in NDCS):
                gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                // The final normal vector in screen space.
                N = normalize( mat3( model_transform ) * normal / squared_scale);
                vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;
            } `;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // A fragment is a pixel that's overlapped by the current triangle.
        // Fragments affect the final image or get discarded due to depth.
        return this.shared_glsl_code() + `
            void main(){                                                           
                // Compute an initial (ambient) color:
                gl_FragColor = vec4( shape_color.xyz * ambient, shape_color.w );
                // Compute the final color with contributions from lights:
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
            } `;
    }

    send_material(gl, gpu, material) {
        // send_material(): Send the desired shape-wide material qualities to the
        // graphics card, where they will tweak the Phong lighting formula.
        gl.uniform4fv(gpu.shape_color, material.color);
        gl.uniform1f(gpu.ambient, material.ambient);
        gl.uniform1f(gpu.diffusivity, material.diffusivity);
        gl.uniform1f(gpu.specularity, material.specularity);
        gl.uniform1f(gpu.smoothness, material.smoothness);
    }

    send_gpu_state(gl, gpu, gpu_state, model_transform) {
        // send_gpu_state():  Send the state of our whole drawing context to the GPU.
        const O = vec4(0, 0, 0, 1), camera_center = gpu_state.camera_transform.times(O).to3();
        gl.uniform3fv(gpu.camera_center, camera_center);
        // Use the squared scale trick from "Eric's blog" instead of inverse transpose matrix:
        const squared_scale = model_transform.reduce(
            (acc, r) => {
                return acc.plus(vec4(...r).times_pairwise(r))
            }, vec4(0, 0, 0, 0)).to3();
        gl.uniform3fv(gpu.squared_scale, squared_scale);
        // Send the current matrices to the shader.  Go ahead and pre-compute
        // the products we'll need of the of the three special matrices and just
        // cache and send those.  They will be the same throughout this draw
        // call, and thus across each instance of the vertex shader.
        // Transpose them since the GPU expects matrices as column-major arrays.
        const PCM = gpu_state.projection_transform.times(gpu_state.camera_inverse).times(model_transform);
        gl.uniformMatrix4fv(gpu.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        gl.uniformMatrix4fv(gpu.projection_camera_model_transform, false, Matrix.flatten_2D_to_1D(PCM.transposed()));

        // Omitting lights will show only the material color, scaled by the ambient term:
        if (!gpu_state.lights.length)
            return;

        const light_positions_flattened = [], light_colors_flattened = [];
        for (let i = 0; i < 4 * gpu_state.lights.length; i++) {
            light_positions_flattened.push(gpu_state.lights[Math.floor(i / 4)].position[i % 4]);
            light_colors_flattened.push(gpu_state.lights[Math.floor(i / 4)].color[i % 4]);
        }
        gl.uniform4fv(gpu.light_positions_or_vectors, light_positions_flattened);
        gl.uniform4fv(gpu.light_colors, light_colors_flattened);
        gl.uniform1fv(gpu.light_attenuation_factors, gpu_state.lights.map(l => l.attenuation));
    }

    update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
        // update_GPU(): Define how to synchronize our JavaScript's variables to the GPU's.  This is where the shader
        // recieves ALL of its inputs.  Every value the GPU wants is divided into two categories:  Values that belong
        // to individual objects being drawn (which we call "Material") and values belonging to the whole scene or
        // program (which we call the "Program_State").  Send both a material and a program state to the shaders
        // within this function, one data field at a time, to fully initialize the shader for a draw.

        // Fill in any missing fields in the Material object with custom defaults for this shader:
        const defaults = {color: color(0, 0, 0, 1), ambient: 0, diffusivity: 1, specularity: 1, smoothness: 40};
        material = Object.assign({}, defaults, material);

        this.send_material(context, gpu_addresses, material);
        this.send_gpu_state(context, gpu_addresses, gpu_state, model_transform);
    }
}

class Ring_Shader extends Shader {
    update_GPU(context, gpu_addresses, graphics_state, model_transform, material) {
        // update_GPU():  Defining how to synchronize our JavaScript's variables to the GPU's:
        const [P, C, M] = [graphics_state.projection_transform, graphics_state.camera_inverse, model_transform],
            PCM = P.times(C).times(M);
        context.uniformMatrix4fv(gpu_addresses.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        context.uniformMatrix4fv(gpu_addresses.projection_camera_model_transform, false,
            Matrix.flatten_2D_to_1D(PCM.transposed()));
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return `
        precision mediump float;
        varying vec4 point_position;
        varying vec4 center;
        `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        // TODO:  Complete the main function of the vertex shader (Extra Credit Part II).
        return this.shared_glsl_code() + `
        attribute vec3 position;
        uniform mat4 model_transform;
        uniform mat4 projection_camera_model_transform;
        
        void main(){
          
        }`;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // TODO:  Complete the main function of the fragment shader (Extra Credit Part II).
        return this.shared_glsl_code() + `
        void main(){
          
        }`;
    }
}

