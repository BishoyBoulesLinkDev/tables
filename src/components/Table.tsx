import { useState, useCallback } from 'react';
import { TreeSelect, Table, Input } from 'antd';
// import { DeleteOutlined } from '@ant-design/icons';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { _ } from 'lodash';
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
  const [selectedHospitals, setSelectedHospitals] = useState<string[]>(() => {
    const allHospitals = data.cities.flatMap((city) =>
      city.inistitutes.flatMap((institute) => institute.hospitals)
    );
    return allHospitals;
  });

  const [sortedInfo, setSortedInfo] = useState<{
    columnKey: string | null;
    order: 'ascend' | 'descend' | null;
  }>({
    columnKey: null,
    order: null,
  });

  const [manualOrder, setManualOrder] = useState<{ [key: string]: number }>({});

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

  // const handleDelete = (hospitalToDelete: string) => {
  //   setSelectedHospitals((prev) => prev.filter((hospital) => hospital !== hospitalToDelete));
  // };

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

  // const tProps = {
  //   treeData,
  //   value: selectedHospitals,
  //   onChange: handleChange,
  //   treeCheckable: true,
  //   showCheckedStrategy: TreeSelect.SHOW_CHILD,
  //   placeholder: 'اختر المستشفى',
  //   style: {
  //     width: '300px',
  //   },
  //   treeCheckStrictly: true,
  //   multiple: true,
  // };

  const debouncedUpdateOrder = useCallback(
    _.debounce((newIndex: number, currentIndex: number) => {
      setSelectedHospitals((prev) => {
        const newArray = [...prev];
        const [removed] = newArray.splice(currentIndex, 1);
        newArray.splice(newIndex, 0, removed);
        return newArray;
      });
    }, 100),
    []
  );

  const updateOrderNumbers = (
    hospital: string,
    newValue: number,
    currentManualOrder: { [key: string]: number }
  ) => {
    const newOrder = { ...currentManualOrder };

    Object.keys(newOrder).forEach((key) => {
      if (newOrder[key] === newValue) {
        delete newOrder[key];
      }
    });

    newOrder[hospital] = newValue;
    return newOrder;
  };

  const columns = [
    {
      title: 'الترتيب',
      dataIndex: 'sort',
      width: '15%',
      render: (_: unknown, record: { hospital: string }, index: number) => {
        const displayIndex =
          manualOrder[record.hospital] ||
          (sortedInfo.columnKey ? index + 1 : selectedHospitals.indexOf(record.hospital) + 1);

        return (
          <Input
            type="number"
            min={1}
            max={selectedHospitals.length}
            value={displayIndex}
            placeholder="الترتيب"
            style={{ width: '60px' }}
            onChange={(e) => {
              const newValue = parseInt(e.target.value);
              if (!isNaN(newValue) && newValue >= 1 && newValue <= selectedHospitals.length) {
                const newIndex = newValue - 1;
                const currentIndex = selectedHospitals.indexOf(record.hospital);

                setManualOrder((prev) => {
                  console.log('prev', prev);
                  console.log('newValue', newValue);

                  return updateOrderNumbers(record.hospital, newValue, prev);
                });

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
      width: '35%',
      // sorter: (a, b) => a.hospital.localeCompare(b.hospital),
    },
    {
      title: 'الإدارة',
      dataIndex: 'institute',
      key: 'institute',
      width: '25%',
      sorter: (a: { hospital: string }, b: { hospital: string }) => {
        const getInstitute = (record: { hospital: string }) => {
          return (
            data.cities
              .flatMap((city) =>
                city.inistitutes.find((inst) => inst.hospitals.includes(record.hospital))
              )
              .filter(Boolean)[0]?.name || ''
          );
        };
        return getInstitute(a).localeCompare(getInstitute(b));
      },
      render: (_: unknown, record: { hospital: string }) => {
        const institute =
          data.cities
            .flatMap((city) =>
              city.inistitutes.find((inst) => inst.hospitals.includes(record.hospital))
            )
            .filter(Boolean)[0]?.name || '';
        return institute;
      },
    },
    {
      title: 'المديرية',
      dataIndex: 'city',
      key: 'city',
      width: '25%',
      sorter: (a: { hospital: string }, b: { hospital: string }) => {
        const getCity = (record: { hospital: string }) => {
          return (
            data.cities.find((city) =>
              city.inistitutes.some((inst) => inst.hospitals.includes(record.hospital))
            )?.name || ''
          );
        };
        return getCity(a).localeCompare(getCity(b));
      },
      render: (_: unknown, record: { hospital: string }) => {
        const city =
          data.cities.find((city) =>
            city.inistitutes.some((inst) => inst.hospitals.includes(record.hospital))
          )?.name || '';
        return city;
      },
    },
    // {
    //   title: 'الإجراءات',
    //   key: 'actions',
    //   width: '10%',
    //   render: (_: unknown, record: { hospital: string }) => (
    //     <>
    //       <Button
    //         type="text"
    //         danger
    //         icon={<DeleteOutlined />}
    //         onClick={() => handleDelete(record.hospital)}
    //       />
    //     </>
    //   ),
    // },
  ];

  return (
    <main className="table">
      {/* <section style={{ marginBottom: '20px' }}>
        <TreeSelect {...tProps} />
      </section> */}
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
              onChange={(_, __, sorter) => {
                if (Array.isArray(sorter)) {
                  setSortedInfo({
                    columnKey: sorter[0]?.columnKey || null,
                    order: sorter[0]?.order || null,
                  });
                } else {
                  setSortedInfo({
                    columnKey: sorter.columnKey || null,
                    order: sorter.order || null,
                  });
                  setManualOrder({});
                }
              }}
            />
          </SortableContext>
        </DndContext>
      </section>
    </main>
  );
}
