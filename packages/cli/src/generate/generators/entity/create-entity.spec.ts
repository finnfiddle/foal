// FoalTS
import { FileSystem } from '../../file-system';
import { createEntity } from './create-entity';

describe('createEntity', () => {

  const fs = new FileSystem();

  beforeEach(() => fs.setUp());

  afterEach(() => fs.tearDown());

  function test(root: string) {

    describe(`when the directory ${root}/ exists`, () => {

      beforeEach(() => {
        fs
          .ensureDir(root)
          .cd(root)
          .copyFixture('entity/index.ts', 'index.ts');
      });

      it('should render the templates in the proper directory.', () => {
        createEntity({ name: 'test-fooBar' });

        fs
          .assertEqual('test-foo-bar.entity.ts', 'entity/test-foo-bar.entity.ts')
          .assertEqual('index.ts', 'entity/index.ts');
      });

      it('create index.ts if it does not exist.', () => {
        fs.rmfile('index.ts');

        createEntity({ name: 'test-fooBar' });

        fs.assertExists('index.ts');
      });

    });

  }

  test('src/app/entities');
  test('entities');
  test('');

});
