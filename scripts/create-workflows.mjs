import fs from 'fs';

const sdxl = {
  "3": {
    "inputs": {
      "seed": 42,
      "steps": 20,
      "cfg": 7.5,
      "sampler_name": "euler_a",
      "scheduler": "normal",
      "denoise": 1,
      "model": ["67", 0],
      "positive": ["75", 0],
      "negative": ["76", 0],
      "latent_image": ["68", 0]
    },
    "class_type": "KSampler"
  },
  "67": {
    "inputs": {
      "ckpt_name": "sd_xl_base_1.0.safetensors"
    },
    "class_type": "CheckpointLoaderSimple"
  },
  "68": {
    "inputs": {
      "width": 1024,
      "height": 1024,
      "batch_size": 1
    },
    "class_type": "EmptyLatentImage"
  },
  "69": {
    "inputs": {
      "samples": ["3", 0],
      "vae": ["67", 2]
    },
    "class_type": "VAEDecode"
  },
  "74": {
    "inputs": {
      "filename_prefix": "sdxl",
      "images": ["69", 0]
    },
    "class_type": "SaveImage"
  },
  "75": {
    "inputs": {
      "text": "PLACEHOLDER_POSITIVE",
      "clip": ["67", 1]
    },
    "class_type": "CLIPTextEncode"
  },
  "76": {
    "inputs": {
      "text": "low quality, blurry",
      "clip": ["67", 1]
    },
    "class_type": "CLIPTextEncode"
  }
};

const svd = {
  "3": {
    "inputs": {
      "seed": 42,
      "steps": 25,
      "cfg": 2.5,
      "sampler_name": "euler",
      "scheduler": "simple",
      "denoise": 1,
      "model": ["67", 0],
      "positive": ["75", 0],
      "negative": ["76", 0],
      "latent_image": ["68", 0]
    },
    "class_type": "KSampler"
  },
  "67": {
    "inputs": {
      "ckpt_name": "svd_xt.safetensors"
    },
    "class_type": "CheckpointLoaderSimple"
  },
  "68": {
    "inputs": {
      "width": 1024,
      "height": 576,
      "batch_size": 1
    },
    "class_type": "EmptyLatentImage"
  },
  "69": {
    "inputs": {
      "samples": ["3", 0],
      "vae": ["67", 2]
    },
    "class_type": "VAEDecode"
  },
  "74": {
    "inputs": {
      "filename_prefix": "svd",
      "images": ["69", 0]
    },
    "class_type": "SaveImage"
  },
  "75": {
    "inputs": {
      "text": "PLACEHOLDER_POSITIVE",
      "clip": ["67", 1]
    },
    "class_type": "CLIPTextEncode"
  },
  "76": {
    "inputs": {
      "text": "low quality",
      "clip": ["67", 1]
    },
    "class_type": "CLIPTextEncode"
  }
};

fs.writeFileSync('F:\\Workflows\\sdxl-i2i.json', JSON.stringify(sdxl, null, 2), 'utf8');
fs.writeFileSync('F:\\Workflows\\svd-i2i.json', JSON.stringify(svd, null, 2), 'utf8');
console.log('✓ Created sdxl-i2i.json + svd-i2i.json');
