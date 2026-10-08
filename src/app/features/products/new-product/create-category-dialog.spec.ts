import { TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateCategoryDialog } from './create-category-dialog';

describe('CreateCategoryDialog', () => {
  const dialogRefMock = { close: vi.fn() };

  beforeEach(async () => {
    dialogRefMock.close.mockReset();
    await TestBed.configureTestingModule({
      imports: [CreateCategoryDialog],
      providers: [{ provide: MatDialogRef, useValue: dialogRefMock }],
    }).compileComponents();
  });

  it('trims the name before returning it', () => {
    const fixture = TestBed.createComponent(CreateCategoryDialog);
    fixture.componentInstance.name.setValue('  Accesorios  ');

    fixture.componentInstance.create();

    expect(dialogRefMock.close).toHaveBeenCalledWith('Accesorios');
  });

  it('does not close for a blank name', () => {
    const fixture = TestBed.createComponent(CreateCategoryDialog);
    fixture.componentInstance.name.setValue('   ');

    fixture.componentInstance.create();

    expect(dialogRefMock.close).not.toHaveBeenCalled();
    expect(fixture.componentInstance.name.touched).toBe(true);
  });
});
