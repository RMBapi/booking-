const path = require('path');

module.exports = function (options, webpack) {
  return {
    ...options,
    plugins: [
      ...options.plugins,
      {
        apply: (compiler) => {
          compiler.hooks.afterEmit.tap('CopyGenerated', () => {
            const fs = require('fs');
            const distPath = path.join(__dirname, 'dist');
            const generatedPath = path.join(__dirname, 'generated');
            const symlinkPath = path.join(distPath, 'generated');
            
            if (fs.existsSync(distPath) && fs.existsSync(generatedPath)) {
              try {
                if (fs.existsSync(symlinkPath)) {
                  fs.unlinkSync(symlinkPath);
                }
                fs.symlinkSync(path.relative(distPath, generatedPath), symlinkPath, 'dir');
                console.log('Created symlink: dist/generated -> ../generated');
              } catch (err) {
                // Ignore errors
              }
            }
          });
        },
      },
    ],
  };
};
