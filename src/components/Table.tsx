import { useState, useCallback } from 'react';
import { TreeSelect, Table, Button, Input } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { debounce } from 'lodash';
import data from '../data/database.json';
import { DraggableBodyRow } from './DraggableBodyRow';

type TreeNode = {
  title: string;
  value: string;
  key: string;
  checkable?: boolean;
  children?: TreeNode[];
};

interface TreeSelectValue {
  label: string;
  value: string;
  halfChecked?: boolean;
  disabled?: boolean;
}

export default function Tables() {
  const [selectedHospitals, setSelectedHospitals] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1,
      },
    })
  );

  const handleChange = (newValue: TreeSelectValue[] | TreeSelectValue) => {
    const values = Array.isArray(newValue) ? newValue : [newValue];

    const hospitalValues = values
      .map((item) => item.value)
      .filter(
        (value) =>
          value &&
          typeof value === 'string' &&
          !value.startsWith('city-') &&
          !value.startsWith('inst-')
      );

    setSelectedHospitals(hospitalValues);
  };

  const treeData: TreeNode[] = data.cities.map((city) => ({
    title: city.name,
    value: `city-${city.name}`,
    key: `city-${city.name}`,
    checkable: false,
    children: city.inistitutes.map((institute) => ({
      title: institute.name,
      value: `inst-${institute.name}`,
      key: `inst-${institute.name}`,
      checkable: true,
      children: institute.hospitals.map((hospital) => ({
        title: hospital,
        value: hospital,
        key: hospital,
        checkable: true,
      })),
    })),
  }));

  const handleDelete = (hospitalToDelete: string) => {
    setSelectedHospitals((prev) => prev.filter((hospital) => hospital !== hospitalToDelete));
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      setSelectedHospitals((previous) => {
        const activeHospital = (active.id as string).replace('hospital-', '');
        const overHospital = (over?.id as string).replace('hospital-', '');

        const activeIndex = previous.indexOf(activeHospital);
        const overIndex = previous.indexOf(overHospital);

        return arrayMove(previous, activeIndex, overIndex);
      });
    }
  };

  const tProps = {
    treeData,
    value: selectedHospitals,
    onChange: handleChange,
    treeCheckable: true,
    showCheckedStrategy: TreeSelect.SHOW_CHILD,
    placeholder: 'اختر المستشفى',
    style: {
      width: '300px',
    },
    treeCheckStrictly: true,
    multiple: true,
  };

  const debouncedUpdateOrder = useCallback(
    debounce((newIndex: number, currentIndex: number) => {
      setSelectedHospitals((prev) => {
        const newArray = [...prev];
        const [removed] = newArray.splice(currentIndex, 1);
        newArray.splice(newIndex, 0, removed);
        return newArray;
      });
    }, 100),
    []
  );

  const columns = [
    {
      title: 'الترتيب',
      dataIndex: 'sort',
      width: '25%',
      render: (_: unknown, record: { hospital: string }) => {
        const currentIndex = selectedHospitals.indexOf(record.hospital) + 1;
        return (
          <Input
            type="number"
            min={1}
            max={selectedHospitals.length}
            value={currentIndex}
            placeholder="الترتيب"
            style={{ width: '60px' }}
            onChange={(e) => {
              const newIndex = parseInt(e.target.value) - 1;
              if (!isNaN(newIndex) && newIndex >= 0 && newIndex < selectedHospitals.length) {
                const currentIndex = selectedHospitals.indexOf(record.hospital);
                debouncedUpdateOrder(newIndex, currentIndex);
              }
            }}
          />
        );
      },
    },
    {
      title: 'المستشفى',
      dataIndex: 'hospital',
      key: 'hospital',
      width: '65%',
    },
    {
      title: 'الإجراءات',
      key: 'actions',
      width: '10%',
      render: (_: unknown, record: { hospital: string }) => (
        <>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.hospital)}
          />
        </>
      ),
    },
  ];

  return (
    <main className="table">
      <section style={{ marginBottom: '20px' }}>
        <TreeSelect {...tProps} />
      </section>
      <section>
        <DndContext sensors={sensors} modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
          <SortableContext items={selectedHospitals}>
            <Table
              components={{
                body: {
                  row: DraggableBodyRow,
                },
              }}
              dataSource={selectedHospitals.map((hospital) => ({
                hospital,
                key: hospital,
              }))}
              columns={columns}
              pagination={false}
              scroll={{ y: 400 }}
            />
          </SortableContext>
        </DndContext>
      </section>
    </main>
  );
}
