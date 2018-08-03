#Binding config
{
  'variables' : {
    'tensorflow_include_dir' : '<(module_root_dir)/deps/tensorflow/include',
    'tensorflow_lib_dir' : '<(module_root_dir)/deps/tensorflow/lib',
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
            '-Wl,-rpath,<@(tensorflow_lib_dir)',
            '-ltensorflow',
          ],
          'library_dirs' : ['<(tensorflow_lib_dir)'],
          'variables': {
            'tensorflow-library-target': 'darwin'
          }
        }
      ],
      [
        'OS=="win"', {
          'defines': ['COMPILER_MSVC'],
          'libraries': ['tensorflow'],
          'library_dirs' : ['<(INTERMEDIATE_DIR)'],
          'actions': [
            {
              'action_name': 'generate_def',
              'inputs': [
                '<(module_root_dir)/scripts/generate_defs.js',
                '<@(tensorflow_headers)'
              ],
              'outputs': [
                '<(INTERMEDIATE_DIR)/tensorflow.def'
              ],
              'action': [
                'cmd',
                '/c node <@(_inputs) > <@(_outputs)'
              ]
            },
            {
              'action_name': 'build-tensorflow-lib',
              'inputs': [
                '<(INTERMEDIATE_DIR)/tensorflow.def'
              ],
              'outputs': [
                '<(INTERMEDIATE_DIR)/tensorflow.lib'
              ],
              'action': [
                'lib',
                '/def:<@(_inputs)',
                '/out:<@(_outputs)',
                '/machine:<@(target_arch)'
              ]
            },
          ],
        },
      ]
    ],
    # 'actions': [
    #   {
    #     'action_name': 'download_libtensorflow',
    #     'inputs': [
    #       '<(module_root_dir)/scripts/download-libtensorflow.sh',
    #     ],
    #     'outputs': [
    #       '<(PRODUCT_DIR)/libtensorflow.so',
    #     ],
    #     'action': [
    #       'sh',
    #       '<@(_inputs)',
    #       '<(tensorflow-library-target)',
    #     ]
    #   }
    # ],
  }]
}
