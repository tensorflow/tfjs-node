#Binding config
{
  'variables' : {
    'tensorflow_include_dir' : '<(module_root_dir)/deps/include',
    'tensorflow_lib_dir' : '<(module_root_dir)/deps/lib',
    'tensorflow_headers' : [
      '<@(tensorflow_include_dir)/tensorflow/c/c_api.h',
      '<@(tensorflow_include_dir)/tensorflow/c/eager/c_api.h',
    ],
  },
  'targets' : [{
    'target_name' : 'tfjs_binding',
    'sources' : [
      'binding/tfe_utils.cc',
      'binding/tfjs_backend.cc',
      'binding/tfjs_binding.cc'
    ],
    'include_dirs' : [ '..', '<(tensorflow_include_dir)' ],
    'conditions' : [
      [
        'OS=="linux"', {
          'libraries' : [
            '-Wl,-rpath,<@(tensorflow_lib_dir)',
            '-ltensorflow',
          ],
          'library_dirs' : ['<(tensorflow_lib_dir)'],
          'variables': {
            'tensorflow-library-target': 'linux-cpu'
          }
        }
      ],
      [
        'OS=="mac"', {
          'libraries' : [
            '-Wl,-rpath,@loader_path',
            '-ltensorflow',
          ],
          'library_dirs' : ['<(PRODUCT_DIR)'],
          'variables': {
            'tensorflow-library-target': 'darwin'
          }
        }
      ],
    ],
    'actions': [
      {
        'action_name': 'get_libtensorflow',
        'inputs': [
          '<(module_root_dir)/scripts/get_libtensorflow.js'
        ],
        'outputs': [
          '<(PRODUCT_DIR)/libtensorflow.so',
        ],
        'action': [
          'node',
          '<@(_inputs)',
          '<(PRODUCT_DIR)',
          '<(tensorflow-library-target)',
        ]
      }
    ],
  }]
}
